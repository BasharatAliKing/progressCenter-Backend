# Detailed Schedule API Documentation

## Base URL: `/api`

---

## � XER FILE IMPORT Operations

### 1. Import XER File (Save to Database)
**POST** `/api/schedule/import-xer`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `xerFile`: XER file (max 50MB)

**Response:**
```json
{
  "success": true,
  "message": "XER file imported successfully",
  "schedule": {
    "_id": "...",
    "project": "Project Name from XER",
    "start_date": "10-Oct-25",
    "end_date": "10-Jun-26",
    "duration": 244,
    "tasks": [...]
  }
}
```

---

### 2. Preview XER File (Without Saving)
**POST** `/api/schedule/preview-xer`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `xerFile`: XER file (max 50MB)

**Response:**
```json
{
  "success": true,
  "message": "XER file parsed successfully",
  "preview": {
    "project": "Project Name",
    "start_date": "10-Oct-25",
    "end_date": "10-Jun-26",
    "duration": 244,
    "taskCount": 5,
    "totalSubtasks": 25
  },
  "data": { /* Full schedule data */ }
}
```

---

## �📋 SCHEDULE CRUD Operations

### 1. Create New Schedule
**POST** `/api/schedule`

**Body:**
```json
{
  "project": "Project Name",
  "start_date": "10-Oct-25",
  "end_date": "10-Jun-26",
  "duration": 244,
  "tasks": []
}
```

---

### 2. Get All Schedules
**GET** `/api/schedule`

**Response:**
```json
{
  "success": true,
  "schedules": [...]
}
```

---

### 3. Get Schedule by ID
**GET** `/api/schedule/:id`

**Example:** `/api/schedule/507f1f77bcf86cd799439011`

---

### 4. Update Schedule
**PUT** `/api/schedule/:id`

**Body:** (Any field you want to update)
```json
{
  "project": "Updated Project Name",
  "duration": 250
}
```

---

### 5. Delete Schedule
**DELETE** `/api/schedule/:id`

---

## 📝 TASK Operations (Level 1)

### 6. Add Task to Schedule
**POST** `/api/schedule/:id/task`

**Body:**
```json
{
  "name": "New Task",
  "duration": 50,
  "start_date": "10-Oct-25",
  "end_date": "28-Nov-25",
  "subtasks": []
}
```

---

### 7. Update Task by Index
**PUT** `/api/schedule/:id/task/:taskIndex`

**Example:** `/api/schedule/507f1f77bcf86cd799439011/task/0`

**Body:**
```json
{
  "name": "Updated Task Name",
  "duration": 60
}
```

---

### 8. Delete Task by Index
**DELETE** `/api/schedule/:id/task/:taskIndex`

**Example:** `/api/schedule/507f1f77bcf86cd799439011/task/0`

---

## 🔁 SUBTASK Operations (Nested - Unlimited Levels)

### 9. Add Subtask (Nested)
**POST** `/api/schedule/:id/task/:taskIndex/subtask?path=X.Y.Z`

**Examples:**

**Add subtask to task[0]:**
```
POST /api/schedule/507f1f77bcf86cd799439011/task/0/subtask
```

**Add subtask to task[0].subtasks[1]:**
```
POST /api/schedule/507f1f77bcf86cd799439011/task/0/subtask?path=1
```

**Add subtask to task[0].subtasks[1].subtasks[2]:**
```
POST /api/schedule/507f1f77bcf86cd799439011/task/0/subtask?path=1.2
```

**Body:**
```json
{
  "name": "New Subtask",
  "duration": 10,
  "start_date": "10-Oct-25",
  "end_date": "20-Oct-25",
  "subtasks": []
}
```

---

### 10. Update Subtask (Nested)
**PUT** `/api/schedule/:id/task/:taskIndex/subtask/:subtaskIndex?path=X.Y`

**Examples:**

**Update task[0].subtasks[0]:**
```
PUT /api/schedule/507f1f77bcf86cd799439011/task/0/subtask/0
```

**Update task[0].subtasks[1].subtasks[2]:**
```
PUT /api/schedule/507f1f77bcf86cd799439011/task/0/subtask/2?path=1
```

**Body:**
```json
{
  "name": "Updated Subtask Name",
  "duration": 15
}
```

---

### 11. Delete Subtask (Nested)
**DELETE** `/api/schedule/:id/task/:taskIndex/subtask/:subtaskIndex?path=X.Y`

**Examples:**

**Delete task[0].subtasks[0]:**
```
DELETE /api/schedule/507f1f77bcf86cd799439011/task/0/subtask/0
```

**Delete task[0].subtasks[1].subtasks[2]:**
```
DELETE /api/schedule/507f1f77bcf86cd799439011/task/0/subtask/2?path=1
```

---

## 🧭 Path Parameter Explanation

The `path` query parameter allows you to navigate through nested subtasks.

**Format:** `path=X.Y.Z` where X, Y, Z are indices

**Examples:**

- `path=0` → Navigate to `subtasks[0]`
- `path=0.1` → Navigate to `subtasks[0].subtasks[1]`
- `path=0.1.2` → Navigate to `subtasks[0].subtasks[1].subtasks[2]`
- `path=1.0.3` → Navigate to `subtasks[1].subtasks[0].subtasks[3]`

---

## 📊 Complete Example Workflow

### Step 1: Create Schedule
```bash
POST /api/schedule
{
  "project": "UPLIFTING OF NEELA GUMBAD AREA",
  "start_date": "10-Oct-25",
  "end_date": "10-Jun-26",
  "duration": 244,
  "tasks": []
}
```

Response: `{ "success": true, "schedule": { "_id": "507f..." } }`

---

### Step 2: Add Task
```bash
POST /api/schedule/507f.../task
{
  "name": "Engineering",
  "duration": 71,
  "start_date": "10-Oct-25",
  "end_date": "19-Dec-25",
  "subtasks": []
}
```

---

### Step 3: Add Subtask to Task[0]
```bash
POST /api/schedule/507f.../task/0/subtask
{
  "name": "Shop Drawings",
  "duration": 71,
  "start_date": "10-Oct-25",
  "end_date": "19-Dec-25",
  "subtasks": []
}
```

---

### Step 4: Add Nested Subtask to Task[0].Subtasks[0]
```bash
POST /api/schedule/507f.../task/0/subtask?path=0
{
  "name": "Submission",
  "duration": 57,
  "start_date": "10-Oct-25",
  "end_date": "05-Dec-25",
  "subtasks": []
}
```

---

### Step 5: Update Nested Subtask
```bash
PUT /api/schedule/507f.../task/0/subtask/0?path=0
{
  "duration": 60
}
```

---

### Step 6: Delete Nested Subtask
```bash
DELETE /api/schedule/507f.../task/0/subtask/0?path=0
```

---

## ✅ Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "schedule": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🔥 Key Features

✅ Unlimited nested subtasks (array in array in array...)  
✅ Full CRUD on every level  
✅ Path-based navigation for deep nesting  
✅ Index-based operations for simplicity  
✅ Mongoose schema validation  
✅ Clean RESTful API design  

---

## 🧪 Test with Postman/Thunder Client

1. Create a schedule
2. Get the `_id` from response
3. Add tasks using the schedule ID
4. Add subtasks using task index and optional path
5. Update/delete at any level using indices and path

---

---

## 📄 XER File Format Information

### What is a XER File?
- **XER files** are Primavera P6 export files
- They contain project scheduling data in tab-delimited format
- Common in construction and project management
- Contains tasks, WBS, resources, and relationships

### Supported XER Data:
✅ **Project Information** (name, dates, duration)  
✅ **Work Breakdown Structure (WBS)**  
✅ **Tasks/Activities** with hierarchical relationships  
✅ **Start and End Dates**  
✅ **Duration calculations**  
✅ **Nested subtask structures**  

### XER Import Process:
1. **Upload** → XER file is parsed and validated
2. **Convert** → Data is transformed to our JSON schema
3. **Hierarchy** → Task relationships are built automatically
4. **Save** → Complete schedule saved to MongoDB

---

## 🧪 Testing XER Import

### Using Postman/Thunder Client:

**Step 1: Import XER File**
```
POST /api/schedule/import-xer
Content-Type: multipart/form-data

Form Data:
- Key: xerFile
- Type: File
- Value: [Select your .xer file]
```

**Step 2: Preview Before Import**
```
POST /api/schedule/preview-xer
Content-Type: multipart/form-data

Form Data:
- Key: xerFile  
- Type: File
- Value: [Select your .xer file]
```

---

## 🔧 Frontend Integration Example

### JavaScript/React Example:
```javascript
// Import XER file
const importXER = async (file) => {
  const formData = new FormData();
  formData.append('xerFile', file);
  
  const response = await fetch('/api/schedule/import-xer', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result;
};

// Preview XER file
const previewXER = async (file) => {
  const formData = new FormData();
  formData.append('xerFile', file);
  
  const response = await fetch('/api/schedule/preview-xer', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result;
};
```

### HTML Form Example:
```html
<form enctype="multipart/form-data">
  <input type="file" name="xerFile" accept=".xer,.XER" required>
  <button type="submit">Import XER File</button>
</form>
```

---

## ⚠️ Error Handling

### Common Errors:
- **File too large**: Max 50MB allowed
- **Invalid file type**: Only .XER files accepted
- **Corrupted XER**: Invalid file format or structure
- **Missing project data**: XER file doesn't contain valid project information

### Error Response Format:
```json
{
  "success": false,
  "error": "Error description here"
}
```

---

**Enjoy your complete nested CRUD system with XER import! 🚀**
