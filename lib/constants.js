
export const generalPerformanceQuestions = [
  "Which of these ads performed the best overall, and why?",
  "Which ad had the best return on investment?",
  "Summarise which ad had the highest click-through rate and lowest cost per click."
]

export const  conversionBasedWithTicketSales = [
  "Compare ticket sales and revenue across the ads. Which had the best cost per sale?",
  "Which ads generated the most revenue for the money spent?",
  "Identify any ads that had high spend but low ticket sales."
]

export const  strategyAdvice = [
  "What optimizations would you suggest based on this data?",
  "Are there any ads that should be paused due to poor performance?",
  "What do these results suggest about which types of creative perform best?"
]

export const  ABTestingInsight = [
  "Compare video ads vs image ads. Which format performed better?",
  "Compare performance between different bid strategies. Any trends?"
]

export const selectAIArray = [
  {display:'General Performance Questions', value:generalPerformanceQuestions},
  {display:'Conversion Based With Ticket Sales', value:conversionBasedWithTicketSales},
  {display:'Strategy Advice', value:strategyAdvice},
  {display:'AB Testing Insight', value:ABTestingInsight},
]

export const selectAIObject = {
  'General Performance Questions':generalPerformanceQuestions,
  'Conversion Based With Ticket Sales':conversionBasedWithTicketSales,
  'Strategy Advice':strategyAdvice,
  'AB Testing Insight':ABTestingInsight,
}

export const priorityList = [
  'critical',
  'high',
  'medium',
  'low'
]


export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const recurrenceFrequency = ["daily", "weekly", "monthly"]

export const taskStatusArray = [
'Requested',
'In Progress',
'In Review',
'Completed',
]

export const dateFormatValues = [
  "yyyy/MM/dd",
  "MMMM d, yyyy h:mm aa",
  "h:mm aa",
  "MM/yyyy",
  "yyyy, QQQ",
  "yyyy",
  "MM",
  "DD"

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

export  const workspaceFilterOptions = [
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
  'url',
  'data',
  'list',
  'priority'
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
        "field": "members",
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
