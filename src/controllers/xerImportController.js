import fs from 'fs';
import path from 'path';
import DetailedSchedule from '../models/detailedScheduleModel.js';

/**
 * Parse XER file and extract tables
 */
function parseXERFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const tables = {};
    let currentTable = null;
    let currentFields = [];
    
    console.log(`\n📄 Parsing XER file: ${path.basename(filePath)}`);
    console.log(`Total lines: ${lines.length}`);
    
    for (let line of lines) {
        line = line.trim();
        
        if (!line) continue;
        
        // Table definition
        if (line.startsWith('%T\t')) {
            currentTable = line.split('\t')[1];
            tables[currentTable] = [];
            currentFields = [];
            console.log(`\n📊 Found table: ${currentTable}`);
        }
        // Field definition
        else if (line.startsWith('%F\t')) {
            const fields = line.split('\t').slice(1);
            currentFields = fields;
            console.log(`   Fields (${fields.length}):`, fields.slice(0, 5).join(', ') + '...');
        }
        // Data row
        else if (line.startsWith('%R\t') && currentTable && currentFields.length > 0) {
            const values = line.split('\t').slice(1);
            const row = {};
            
            currentFields.forEach((field, index) => {
                row[field] = values[index] || '';
            });
            
            tables[currentTable].push(row);
        }
    }
    
    // Log summary
    console.log(`\n📋 Parse Summary:`);
    Object.keys(tables).forEach(tableName => {
        console.log(`   ${tableName}: ${tables[tableName].length} rows`);
    });
    
    return tables;
}

/**
 * Build hierarchical structure from flat WBS list
 */
function buildHierarchy(items, parentId = null, level = 0) {
    // Find children of this parent
    const children = items.filter(item => {
        // Root level items
        if (parentId === null) {
            // Root is the one with parent_wbs_id pointing to itself or empty
            return !item.parent_wbs_id || 
                   item.parent_wbs_id === '' || 
                   item.parent_wbs_id === item.wbs_id ||
                   item.proj_node_flag === 'Y'; // Project node is root
        }
        // Child items
        return item.parent_wbs_id === parentId;
    });
    
    if (level === 0) {
        console.log(`\n🌳 Building hierarchy from ${items.length} WBS items`);
        console.log(`   Sample WBS parent_wbs_id values:`, items.slice(0, 3).map(i => ({
            name: i.wbs_name,
            wbs_id: i.wbs_id,
            parent: i.parent_wbs_id,
            isRoot: i.proj_node_flag
        })));
        console.log(`   Root items found: ${children.length}`);
        if (children.length > 0) {
            console.log(`   Root WBS names:`, children.map(c => c.wbs_name).join(', '));
        } else {
            console.log(`   ⚠️ NO ROOT WBS ITEMS FOUND! This will result in empty tasks.`);
        }
    }
    
    return children.map(item => {
        const childItems = buildHierarchy(items, item.wbs_id, level + 1);
        return {
            ...item,
            children: childItems
        };
    });
}

/**
 * Convert WBS hierarchy to task format with activities
 */
function convertToTaskFormat(wbsHierarchy, allTasks, level = 0) {
    const result = [];
    
    console.log(`\n🔄 Converting ${wbsHierarchy.length} WBS items at level ${level}`);
    
    for (const wbs of wbsHierarchy) {
        // Find all activities (tasks) that belong to this WBS
        const activities = allTasks.filter(task => task.wbs_id === wbs.wbs_id);
        
        console.log(`   WBS: "${wbs.wbs_name}" (ID: ${wbs.wbs_id})`);
        console.log(`      - Activities: ${activities.length}`);
        console.log(`      - Children: ${wbs.children ? wbs.children.length : 0}`);
        
        // Create task object from WBS
        const taskObj = {
            name: wbs.wbs_name || 'Unnamed Task',
            start_date: wbs.early_start_date || wbs.anticipate_start_date || '',
            end_date: wbs.early_end_date || wbs.anticipate_end_date || '',
            duration: wbs.anticip_end_date ? parseInt(wbs.anticip_end_date) : 0,
            subtasks: []
        };
        
        // Add activities as subtasks
        for (const activity of activities) {
            console.log(`      + Activity: "${activity.task_name}"`);
            taskObj.subtasks.push({
                name: activity.task_name || 'Unnamed Activity',
                start_date: activity.target_start_date || activity.act_start_date || '',
                end_date: activity.target_end_date || activity.act_end_date || '',
                duration: activity.target_drtn_hr_cnt ? parseInt(activity.target_drtn_hr_cnt) / 8 : 0, // Convert hours to days
                subtasks: []
            });
        }
        
        // Recursively process child WBS items
        if (wbs.children && wbs.children.length > 0) {
            const childTasks = convertToTaskFormat(wbs.children, allTasks, level + 1);
            taskObj.subtasks.push(...childTasks);
        }
        
        result.push(taskObj);
    }
    
    console.log(`   ✅ Converted ${result.length} tasks at level ${level}`);
    
    return result;
}

/**
 * Convert XER data to schedule format
 */
function convertXERToScheduleFormat(tables) {
    // Extract project info
    const project = tables.PROJECT && tables.PROJECT.length > 0 ? tables.PROJECT[0] : null;
    
    if (!project) {
        throw new Error('No project found in XER file');
    }
    
    // Get WBS items and tasks
    const wbsItems = tables.PROJWBS || [];
    const tasks = tables.TASK || [];
    
    console.log(`\n🔍 Processing XER file:`);
    console.log(`   Project: ${project.proj_short_name}`);
    console.log(`   WBS Items: ${wbsItems.length}`);
    console.log(`   Activities: ${tasks.length}`);
    
    // Debug: Show sample data
    if (wbsItems.length > 0) {
        console.log(`\n   Sample WBS item:`, {
            wbs_id: wbsItems[0].wbs_id,
            wbs_name: wbsItems[0].wbs_name,
            parent_wbs_id: wbsItems[0].parent_wbs_id
        });
    }
    if (tasks.length > 0) {
        console.log(`\n   Sample Task:`, {
            task_id: tasks[0].task_id,
            task_name: tasks[0].task_name,
            wbs_id: tasks[0].wbs_id
        });
    }
    
    // Build WBS hierarchy
    const wbsHierarchy = buildHierarchy(wbsItems);
    console.log(`\n   Root WBS items in hierarchy: ${wbsHierarchy.length}`);
    
    // Convert to task format
    const taskHierarchy = convertToTaskFormat(wbsHierarchy, tasks);
    console.log(`\n   ✅ Final converted tasks: ${taskHierarchy.length}`);
    
    // Get dates from project or use defaults
    let startDate = project.plan_start_date || project.last_recalc_date;
    let endDate = project.plan_end_date || project.scd_end_date;
    
    // If no project dates, try to get from tasks
    if (!startDate || !endDate) {
        const taskDates = tasks.map(t => t.target_start_date || t.early_start_date).filter(d => d);
        const taskEndDates = tasks.map(t => t.target_end_date || t.early_end_date).filter(d => d);
        
        if (taskDates.length > 0) startDate = taskDates[0];
        if (taskEndDates.length > 0) endDate = taskEndDates[taskEndDates.length - 1];
    }
    
    // Fallback to current date if still no dates
    if (!startDate) startDate = new Date().toISOString().split('T')[0];
    if (!endDate) endDate = new Date().toISOString().split('T')[0];
    
    console.log(`\n📅 Schedule dates:`, { startDate, endDate });
    
    // Create schedule object
    const schedule = {
        project: project.proj_short_name || 'Untitled Project',
        description: project.proj_name || '',
        start_date: startDate,
        end_date: endDate,
        duration: 0,
        tasks: taskHierarchy
    };
    
    // Calculate total duration
    if (schedule.start_date && schedule.end_date) {
        const start = new Date(schedule.start_date);
        const end = new Date(schedule.end_date);
        schedule.duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
    
    return schedule;
}

/**
 * Import XER file and save to database
 */
export const importXERFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No XER file uploaded' 
            });
        }
        
        console.log('\n=== Starting XER Import ===');
        console.log('File:', req.file.filename);
        
        const filePath = req.file.path;
        
        // Parse XER file
        console.log('\n1. Parsing XER file...');
        const tables = parseXERFile(filePath);
        console.log('Tables found:', Object.keys(tables).join(', '));
        
        // Convert to schedule format
        console.log('\n2. Converting to schedule format...');
        const scheduleData = convertXERToScheduleFormat(tables);
        
        // Save to database
        console.log('\n3. Saving to database...');
        const schedule = new DetailedSchedule(scheduleData);
        await schedule.save();
        
        console.log('✅ Schedule saved successfully');
        console.log(`   - Tasks: ${scheduleData.tasks.length}`);
        console.log('=== Import Complete ===\n');
        
        // Delete uploaded file
        fs.unlinkSync(filePath);
        
        res.status(201).json({
            success: true,
            message: 'XER file imported successfully',
            data: {
                scheduleId: schedule._id,
                project: schedule.project,
                tasksCount: scheduleData.tasks.length
            }
        });
        
    } catch (error) {
        console.error('❌ Import Error:', error.message);
        console.error(error.stack);
        
        // Clean up file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError.message);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to import XER file',
            error: error.message
        });
    }
};

/**
 * Preview XER file without saving
 */
export const previewXERFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No XER file uploaded' 
            });
        }
        
        const filePath = req.file.path;
        
        // Parse and convert
        const tables = parseXERFile(filePath);
        const scheduleData = convertXERToScheduleFormat(tables);
        
        // Delete uploaded file
        fs.unlinkSync(filePath);
        
        res.json({
            success: true,
            message: 'XER file preview generated',
            data: scheduleData
        });
        
    } catch (error) {
        console.error('Preview Error:', error.message);
        
        // Clean up file
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError.message);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to preview XER file',
            error: error.message
        });
    }
};