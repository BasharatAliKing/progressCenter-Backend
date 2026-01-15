import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
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
 * Recursively search for elements in XML object
 */
function findElementsInXML(obj, elementName) {
    let results = [];
    
    if (!obj || typeof obj !== 'object') return results;
    
    // Check if current object has the element
    if (obj[elementName]) {
        const items = Array.isArray(obj[elementName]) ? obj[elementName] : [obj[elementName]];
        results.push(...items);
    }
    
    // Recursively search in all properties
    for (let key in obj) {
        if (typeof obj[key] === 'object') {
            results.push(...findElementsInXML(obj[key], elementName));
        }
    }
    
    return results;
}

/**
 * Parse Primavera P6 XML file and extract data
 */
async function parseXMLFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser({ 
        explicitArray: true,
        mergeAttrs: true,
        tagNameProcessors: [xml2js.processors.stripPrefix]
    });
    
    console.log(`\n📄 Parsing XML file: ${path.basename(filePath)}`);
    
    try {
        const result = await parser.parseStringPromise(fileContent);
        console.log('\n🔍 XML Root keys:', Object.keys(result));
        
        // Try to find Project, WBS, and Activity elements anywhere in the structure
        let projects = findElementsInXML(result, 'Project');
        let wbsList = findElementsInXML(result, 'WBS');
        let activityList = findElementsInXML(result, 'Activity');
        
        // If not found, try alternative names
        if (projects.length === 0) {
            projects = findElementsInXML(result, 'project');
        }
        if (wbsList.length === 0) {
            wbsList = findElementsInXML(result, 'wbs');
        }
        if (activityList.length === 0) {
            activityList = findElementsInXML(result, 'activity');
        }
        
        console.log(`\n📊 Found in XML:`);
        console.log(`   Projects: ${projects.length}`);
        console.log(`   WBS: ${wbsList.length}`);
        console.log(`   Activities: ${activityList.length}`);
        
        // Show sample data structure with actual values
        if (projects.length > 0) {
            console.log(`\n   Sample Project:`, {
                fields: Object.keys(projects[0]).slice(0, 10),
                id: projects[0].Id || projects[0].ObjectId,
                name: projects[0].Name
            });
        }
        if (wbsList.length > 0) {
            console.log(`\n   Sample WBS:`, {
                fields: Object.keys(wbsList[0]).slice(0, 10),
                id: wbsList[0].ObjectId || wbsList[0].Id,
                name: wbsList[0].Name,
                parent: wbsList[0].ParentObjectId
            });
        }
        if (activityList.length > 0) {
            console.log(`\n   Sample Activity:`, {
                fields: Object.keys(activityList[0]).slice(0, 10),
                id: activityList[0].ObjectId || activityList[0].Id,
                name: activityList[0].Name,
                wbs: activityList[0].WBSObjectId
            });
        }
        
        // Helper function to safely extract value and handle xsi:nil
        const extract = (obj, ...keys) => {
            for (let key of keys) {
                if (obj[key]) {
                    let value = Array.isArray(obj[key]) ? obj[key][0] : obj[key];
                    
                    // Check if value is an object with xsi:nil property (indicates null in XML)
                    if (value && typeof value === 'object' && value['xsi:nil']) {
                        continue; // Try next key
                    }
                    
                    // If value is still an object (not a string/number), it's not a valid value
                    if (value && typeof value === 'object') {
                        continue; // Try next key
                    }
                    
                    return value;
                }
            }
            return ''; // Return empty string if no valid value found
        };
        
        // Convert to table format
        const tables = {
            PROJECT: projects.map(p => ({
                proj_id: extract(p, 'ObjectId', 'Id'),
                proj_short_name: extract(p, 'Id', 'Name') || 'Untitled Project',
                proj_name: extract(p, 'Name'),
                plan_start_date: extract(p, 'PlannedStartDate', 'StartDate'),
                plan_end_date: extract(p, 'PlannedFinishDate', 'FinishDate'),
                scd_end_date: extract(p, 'FinishDate'),
                schedule_percent_complete: parseFloat(extract(p, 'SchedulePercentComplete') || 0),
                performance_percent_complete: parseFloat(extract(p, 'PerformancePercentComplete') || 0)
            })),
            
            PROJWBS: wbsList.map(w => {
                const startDate = extract(w, 'StartDate', 'PlannedStartDate', 'AnticipatedStartDate');
                const endDate = extract(w, 'FinishDate', 'PlannedFinishDate', 'AnticipatedFinishDate');
                return {
                    wbs_id: extract(w, 'ObjectId', 'Id'),
                    proj_id: extract(w, 'ProjectObjectId'),
                    wbs_name: extract(w, 'Name', 'Code'),
                    wbs_short_name: extract(w, 'Code'),
                    parent_wbs_id: extract(w, 'ParentObjectId'),
                    proj_node_flag: extract(w, 'ParentObjectId') ? 'N' : 'Y',
                    early_start_date: startDate,
                    early_end_date: endDate,
                    anticipate_start_date: extract(w, 'PlannedStartDate', 'AnticipatedStartDate'),
                    anticipate_end_date: extract(w, 'PlannedFinishDate', 'AnticipatedFinishDate')
                };
            }),
            
            TASK: activityList.map(t => {
                const startDate = extract(t, 'StartDate', 'PlannedStartDate', 'AnticipatedStartDate');
                const endDate = extract(t, 'FinishDate', 'PlannedFinishDate', 'AnticipatedFinishDate');
                let duration = parseFloat(extract(t, 'Duration', 'PlannedDuration', 'RemainingDuration', 'ActualDuration') || 0);
                
                // If no duration but have dates, calculate it
                if (!duration && startDate && endDate) {
                    try {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        if (!isNaN(start) && !isNaN(end)) {
                            duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) * 8; // Days to hours
                        }
                    } catch (e) {
                        console.warn(`Could not calculate duration for task ${extract(t, 'Name')}`);
                    }
                }
                
                return {
                    task_id: extract(t, 'ObjectId', 'Id'),
                    proj_id: extract(t, 'ProjectObjectId'),
                    wbs_id: extract(t, 'WBSObjectId'),
                    task_name: extract(t, 'Name'),
                    task_code: extract(t, 'Id', 'Code'),
                    target_start_date: startDate,
                    target_end_date: endDate,
                    early_start_date: startDate,
                    early_end_date: endDate,
                    act_start_date: extract(t, 'ActualStartDate'),
                    act_end_date: extract(t, 'ActualFinishDate'),
                    target_drtn_hr_cnt: duration,
                    remain_drtn_hr_cnt: parseFloat(extract(t, 'RemainingDuration') || duration || 0),
                    phys_complete_pct: parseFloat(extract(t, 'PercentComplete', 'PhysicalPercentComplete') || 0),
                    status_code: extract(t, 'Status', 'StatusCode') || 'TK_NotStart'
                };
            })
        };
        
        console.log(`\n📋 Converted to tables:`);
        Object.keys(tables).forEach(tableName => {
            console.log(`   ${tableName}: ${tables[tableName].length} rows`);
            if (tables[tableName].length > 0) {
                console.log(`      Sample:`, JSON.stringify(tables[tableName][0], null, 2).substring(0, 200) + '...');
            }
        });
        
        return tables;
    } catch (error) {
        console.error('❌ XML Parse Error:', error.message);
        console.error(error.stack);
        throw new Error('Failed to parse XML file: ' + error.message);
    }
}

/**
 * Build hierarchy from WBS and activities when buildHierarchy fails
 */
function buildHierarchyFromActivities(wbsItems, activities) {
    console.log(`\n🔧 Building alternative hierarchy...`);
    console.log(`   WBS items: ${wbsItems.length}, Activities: ${activities.length}`);
    
    // Create a map of WBS items
    const wbsMap = new Map();
    wbsItems.forEach(wbs => {
        wbsMap.set(wbs.wbs_id, {
            ...wbs,
            activities: [],
            children: []
        });
    });
    
    // Assign activities to their WBS
    activities.forEach(activity => {
        if (activity.wbs_id && wbsMap.has(activity.wbs_id)) {
            wbsMap.get(activity.wbs_id).activities.push(activity);
        }
    });
    
    // Build parent-child relationships
    wbsMap.forEach((wbs, wbsId) => {
        if (wbs.parent_wbs_id && wbsMap.has(wbs.parent_wbs_id)) {
            wbsMap.get(wbs.parent_wbs_id).children.push(wbs);
        }
    });
    
    // Find root WBS items (no parent or parent not found)
    const rootWBS = Array.from(wbsMap.values()).filter(wbs => 
        !wbs.parent_wbs_id || !wbsMap.has(wbs.parent_wbs_id) || wbs.proj_node_flag === 'Y'
    );
    
    console.log(`   Found ${rootWBS.length} root WBS items`);
    
    // Convert to task format
    function convertWBSToTask(wbs) {
        // Helper to ensure we have valid string dates or null
        const cleanDate = (date) => {
            if (!date || typeof date === 'object') return null;
            return String(date).trim() || null;
        };
        
        const startDate = cleanDate(wbs.early_start_date || wbs.anticipate_start_date);
        const endDate = cleanDate(wbs.early_end_date || wbs.anticipate_end_date);
        
        // Calculate duration from dates if available
        let duration = 0;
        if (startDate && endDate) {
            try {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (!isNaN(start) && !isNaN(end)) {
                    duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Days
                }
            } catch (e) {}
        }
        
        const task = {
            name: wbs.wbs_name || 'Unnamed Task',
            start_date: startDate,
            end_date: endDate,
            duration: duration,
            subtasks: []
        };
        
        // Add activities as subtasks
        wbs.activities.forEach(activity => {
            const actStartDate = cleanDate(activity.target_start_date || activity.early_start_date);
            const actEndDate = cleanDate(activity.target_end_date || activity.early_end_date);
            let actDuration = activity.target_drtn_hr_cnt ? parseFloat(activity.target_drtn_hr_cnt) / 8 : 0;
            
            // Calculate duration if not available
            if (!actDuration && actStartDate && actEndDate) {
                try {
                    const start = new Date(actStartDate);
                    const end = new Date(actEndDate);
                    if (!isNaN(start) && !isNaN(end)) {
                        actDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Days
                    }
                } catch (e) {}
            }
            
            task.subtasks.push({
                name: activity.task_name || 'Unnamed Activity',
                start_date: actStartDate,
                end_date: actEndDate,
                duration: actDuration,
                subtasks: []
            });
        });
        
        // Add child WBS as subtasks
        wbs.children.forEach(childWbs => {
            task.subtasks.push(convertWBSToTask(childWbs));
        });
        
        return task;
    }
    
    return rootWBS.map(wbs => convertWBSToTask(wbs));
}

/**
 * Group activities into hierarchy when no WBS exists
 */
function groupActivitiesIntoHierarchy(activities) {
    console.log(`\n🔧 Grouping ${activities.length} activities...`);
    
    // Try to group by some pattern (first word, code prefix, etc.)
    const groups = new Map();
    
    activities.forEach(activity => {
        // Try to extract a group key (e.g., first part of task code or name)
        let groupKey = 'Ungrouped';
        if (activity.task_code) {
            const match = activity.task_code.match(/^([A-Z]+\d*)/);
            groupKey = match ? match[1] : activity.task_code.substring(0, 4);
        } else if (activity.task_name) {
            groupKey = activity.task_name.split(/[-_\s]/)[0];
        }
        
        if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
        }
        groups.get(groupKey).push(activity);
    });
    
    console.log(`   Created ${groups.size} groups`);
    
    // Convert groups to task hierarchy
    return Array.from(groups.entries()).map(([groupName, groupActivities]) => {
        // Helper to clean dates
        const cleanDate = (date) => {
            if (!date || typeof date === 'object') return null;
            return String(date).trim() || null;
        };
        
        // Calculate group dates from activities
        const activityDates = groupActivities
            .map(a => ({ 
                start: cleanDate(a.target_start_date || a.early_start_date), 
                end: cleanDate(a.target_end_date || a.early_end_date) 
            }))
            .filter(d => d.start && d.end);
        
        let groupStart = null;
        let groupEnd = null;
        let groupDuration = 0;
        
        if (activityDates.length > 0) {
            groupStart = activityDates.reduce((min, d) => !min || d.start < min ? d.start : min, null);
            groupEnd = activityDates.reduce((max, d) => !max || d.end > max ? d.end : max, null);
            
            if (groupStart && groupEnd) {
                try {
                    const start = new Date(groupStart);
                    const end = new Date(groupEnd);
                    if (!isNaN(start) && !isNaN(end)) {
                        groupDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    }
                } catch (e) {}
            }
        }
        
        return {
            name: groupName,
            start_date: groupStart,
            end_date: groupEnd,
            duration: groupDuration,
            subtasks: groupActivities.map(activity => {
                // Helper to clean dates
                const cleanDate = (date) => {
                    if (!date || typeof date === 'object') return null;
                    return String(date).trim() || null;
                };
                
                const actStart = cleanDate(activity.target_start_date || activity.early_start_date);
                const actEnd = cleanDate(activity.target_end_date || activity.early_end_date);
                let actDuration = activity.target_drtn_hr_cnt ? parseFloat(activity.target_drtn_hr_cnt) / 8 : 0;
                
                // Calculate duration if not available
                if (!actDuration && actStart && actEnd) {
                    try {
                        const start = new Date(actStart);
                        const end = new Date(actEnd);
                        if (!isNaN(start) && !isNaN(end)) {
                            actDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                        }
                    } catch (e) {}
                }
                
                return {
                    name: activity.task_name || 'Unnamed Activity',
                    start_date: actStart,
                    end_date: actEnd,
                    duration: actDuration,
                    subtasks: []
                };
            })
        };
    });
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
        
        // Helper to clean dates
        const cleanDate = (date) => {
            if (!date || typeof date === 'object') return null;
            return String(date).trim() || null;
        };
        
        // Create task object from WBS
        const taskObj = {
            name: wbs.wbs_name || 'Unnamed Task',
            start_date: cleanDate(wbs.early_start_date || wbs.anticipate_start_date),
            end_date: cleanDate(wbs.early_end_date || wbs.anticipate_end_date),
            duration: wbs.anticip_end_date ? parseInt(wbs.anticip_end_date) : 0,
            subtasks: []
        };
        
        // Add activities as subtasks
        for (const activity of activities) {
            console.log(`      + Activity: "${activity.task_name}"`);
            taskObj.subtasks.push({
                name: activity.task_name || 'Unnamed Activity',
                start_date: cleanDate(activity.target_start_date || activity.act_start_date),
                end_date: cleanDate(activity.target_end_date || activity.act_end_date),
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
    let taskHierarchy = [];
    
    if (wbsHierarchy.length > 0) {
        // Normal case: WBS hierarchy exists
        taskHierarchy = convertToTaskFormat(wbsHierarchy, tasks);
        console.log(`\n   ✅ Final converted tasks: ${taskHierarchy.length}`);
    } else if (wbsItems.length > 0 && tasks.length > 0) {
        // Fallback: WBS exists but no hierarchy, build it from tasks
        console.log(`\n   ⚠️ No WBS hierarchy found, building from WBS-Activity relationships...`);
        taskHierarchy = buildHierarchyFromActivities(wbsItems, tasks);
        console.log(`   ✅ Built hierarchy with ${taskHierarchy.length} root tasks`);
    } else if (tasks.length > 0) {
        // Last resort: No WBS at all, group activities by some logic
        console.log(`\n   ⚠️ No WBS found, grouping activities...`);
        taskHierarchy = groupActivitiesIntoHierarchy(tasks);
        console.log(`   ✅ Grouped ${taskHierarchy.length} task groups`);
    } else {
        console.log(`\n   ⚠️ No WBS and no activities found!`);
    }
    
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
        schedulePercentageComplete: project.schedule_percent_complete || 0,
        performancePercentageComplete: project.performance_percent_complete || 0,
        tasks: taskHierarchy
    };
    
    // Calculate total duration
    if (schedule.start_date && schedule.end_date) {
        const start = new Date(schedule.start_date);
        const end = new Date(schedule.end_date);
        schedule.duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
    
    console.log(`\n📊 Schedule metrics:`, {
        scheduleComplete: schedule.schedulePercentageComplete + '%',
        performanceComplete: schedule.performancePercentageComplete + '%'
    });
    
    return schedule;
}

/**
 * Import XER/XML file and save to database
 */
export const importXERFile = async (req, res) => {
    // Declare isXML outside try block so it's available in catch
    let isXML = false;
    
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }
        
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        isXML = fileExtension === '.xml';
        
        console.log(`\n=== Starting ${isXML ? 'XML' : 'XER'} Import ===`);
        console.log('File:', req.file.filename);
        
        const filePath = req.file.path;
        
        // Parse file based on type
        console.log(`\n1. Parsing ${isXML ? 'XML' : 'XER'} file...`);
        const tables = isXML ? await parseXMLFile(filePath) : parseXERFile(filePath);
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
            message: `${isXML ? 'XML' : 'XER'} file imported successfully`,
            data: {
                scheduleId: schedule._id,
                project: schedule.project,
                tasksCount: scheduleData.tasks.length,
                fileType: isXML ? 'XML' : 'XER'
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
            message: `Failed to import ${isXML ? 'XML' : 'XER'} file`,
            error: error.message
        });
    }
};

/**
 * Preview XER/XML file without saving
 */
export const previewXERFile = async (req, res) => {
    // Declare isXML outside try block so it's available in catch
    let isXML = false;
    
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }
        
        const filePath = req.file.path;
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        isXML = fileExtension === '.xml';
        
        // Parse and convert based on file type
        const tables = isXML ? await parseXMLFile(filePath) : parseXERFile(filePath);
        const scheduleData = convertXERToScheduleFormat(tables);
        
        // Delete uploaded file
        fs.unlinkSync(filePath);
        
        res.json({
            success: true,
            message: `${isXML ? 'XML' : 'XER'} file preview generated`,
            data: scheduleData,
            fileType: isXML ? 'XML' : 'XER'
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
            message: 'Failed to preview file',
            error: error.message
        });
    }
};