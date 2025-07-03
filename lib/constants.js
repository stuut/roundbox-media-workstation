export const taskStatusArray = [
'Requested',
'In Progress',
'In Review',
'Completed',
]



export const TaskTypes = [
'Social Media Post',
'Article',
'Advertising'
]

export const BoardStatus = [
  'draft',
  'active',
  'completed'
]

export const boardFilterArray = [
  'Boards I Am Assigned',
  'All Workspace Boards',
]

export const boardViewOptions = [
  'Table',
  'Kanban',
  'Calendar',
]

export  const taskFilterOptions = [
  'All',
  'Created by me',
]

export  const boardFilterOptions = [
  'All',
  'Created by me',
]

export const newColumnTypesArray = [
  'text',
  'number',
  'date',
  'checkbox',
  'checkbox list',
  'dropdown',
  'tags',
  'file',
  'formula',
  'url'
]

export const newBoardValuesArray = [
  'number',
  'formula'
]

export const boardTableHeaders = [
  {type:'checkbox',title:''},
  {type:'text',title:'Id'},
  {type:'text', title:'Title'},
  {type:'text', title:'Status'},
  {type:'date', title:'Due Date'},
  {type:'text', title:'Description'},
  {type:'list', title:'Task Members'}
]

export const baseHeaders = [
    {
        "field": "id",
        "index": 0,
        "type": "string",
        "width": 175
    },
    {
        "field": "title",
        "index": 1,
        "type": "string",
        "width": 175
    },
    {
        "field": "status",
        "index": 2,
        "type": "select",
        "width": 175
    },
    {
        "field": "due_date",
        "index": 3,
        "type": "date",
        "width": 175
    },
    {
        "field": "created_at",
        "index": 4,
        "type": "date",
        "width": 175
    },
    {
        "field": "created_by",
        "index": 5,
        "type": "object",
        "width": 175
    },
    {
        "field": "description",
        "index": 6,
        "type": "text",
        "width": 175
    },
    {
        "field": "task_members",
        "index": 7,
        "type": "list",
        "width": 175
    }
]

export const baseKaban = {
    "Requested": [],
    "In Progress": [],
    "In Review": [],
    "Completed": []
}
