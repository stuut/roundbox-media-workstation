import { insertNotification } from "@/lib/supabase";
import { evaluate } from 'mathjs';

 export const  handleDownload = (imageUrl) => {
    // Create a temporary link element
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `gemini-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }



export const  sendEmail = async(userId, subject, text) => {

  const url = "/api/send-email";
    try {
    const response = await fetch(url,{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: to,
        subject: subject,
        text: text
      }),
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    return response
    const json = await response.json();
    console.log(json);
    } catch (error) {
    console.error(error.message);

    }

}


export function sanitizeColumnIdFormulaFunction(inputFormula, columns) {
  return columns.reduce((f, col) => {
    const regex = new RegExp(`\\b${col.id}\\b`, 'g');
    return f.replace(regex, col.safeName);
  }, inputFormula);
}


export function sanitizeFormulaFunction(inputFormula, columns) {
  return columns.reduce((f, col) => {
    const regex = new RegExp(`\\b${col.displayName}\\b`, 'g');
    return f.replace(regex, col.safeName);
  }, inputFormula);
}

export function convertFormulaFunctionToIds(formula, columns) {
  return columns.reduce((f, col) => {
    const regex = new RegExp(`\\b${col.displayName}\\b`, 'g'); // \b ensures whole word match
    return f.replace(regex, col.id);
  }, formula);
}


export function displayFormulaFunction(formula, columns) {
  return columns.reduce((f, col) => {
    const regex = new RegExp(`\\b${col.id}\\b`, 'g'); // \b ensures whole word match
    return f.replace(regex, col.displayName);
  }, formula);
}

const sample_scope = {
    "Target_Ticket_Sales": 1000,
    "Conversion_Rate": 0.05,
    "CTR": 0.03,
    "CPC": 1,
    "CPM": 15,
    "Clicks_Needed": 20000,
    "CPC_Budget_(CPC_Model)": 20000
}

const sample_columns = [
    {
        "displayName": "Target Ticket Sales",
        "safeName": "Target_Ticket_Sales",
        "value": "1000",
        "id": "96d4eed9-d13f-40ec-a50a-f71d8360729b",
        "type": "number"
    },
    {
        "displayName": " Conversion Rate",
        "safeName": "Conversion_Rate",
        "value": "0.05",
        "id": "7567a4cf-e781-4f08-b555-9b4b401c129f",
        "type": "number"
    },
    {
        "displayName": " CTR",
        "safeName": "CTR",
        "value": "0.03",
        "id": "f317e607-e6e3-4c6d-8785-c9108258b64a",
        "type": "number"
    },
    {
        "displayName": " CPC",
        "safeName": "CPC",
        "value": "1",
        "id": "da7ba1f7-276b-43d2-b6e5-4c5b05cf5b8b",
        "type": "number"
    },
    {
        "displayName": " CPM",
        "safeName": "CPM",
        "value": "15",
        "id": "c0a8c3d3-b93d-4859-962e-65cd33569a77",
        "type": "number"
    },
    {
        "displayName": "Clicks Needed",
        "safeName": "Clicks_Needed",
        "value": "96d4eed9-d13f-40ec-a50a-f71d8360729b / 7567a4cf-e781-4f08-b555-9b4b401c129f",
        "id": "d6c6a8f2-f668-4f67-a0bf-5c236d29fb51",
        "type": "formula"
    },
    {
        "displayName": "CPC Budget (CPC Model)",
        "safeName": "CPC_Budget_(CPC_Model)",
        "value": "d6c6a8f2-f668-4f67-a0bf-5c236d29fb51 * da7ba1f7-276b-43d2-b6e5-4c5b05cf5b8b",
        "id": "6aabf144-209a-4ee4-a902-1098289391a3",
        "type": "formula"
    }
]

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

export function aggregateColumnValues(columnValues, method = 'sum') {
  const scope = {};


  for (const { displayName, safeName, value, type } of columnValues) {

    let numericValue

    if (type === 'number'){
      numericValue = typeof value === 'number' ? value : parseFloat(value);
    }else if (type === 'formula'){
      //console.log('displayName', displayName)
      //console.log('safeName', safeName)
      //console.log('value', value)
      //console.log('columnValues', columnValues)
      const sanitisedFormula = sanitizeColumnIdFormulaFunction(value, columnValues)


      //const scope = aggregateColumnValuesInternal(columnValues, 'sum'); // or 'avg', 'max', etc.

      if (!isEmptyObject(scope)){



        try{
            const evalResult = evaluate(sanitisedFormula, scope);
            numericValue = evalResult
        }catch(error){
          console.log('sanitisedFormula', sanitisedFormula)
          console.log('scope', scope)

        }



      }

    }


    if (isNaN(numericValue)) continue;

    if (!scope[safeName]) {
      scope[safeName] = [];
    }

    scope[safeName].push(numericValue);
  }

  // Apply aggregation
  Object.keys(scope).forEach(key => {
    const values = scope[key];

    switch (method) {
      case 'avg':
        scope[key] = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'max':
        scope[key] = Math.max(...values);
        break;
      case 'min':
        scope[key] = Math.min(...values);
        break;
      case 'sum':
      default:
        scope[key] = values.reduce((a, b) => a + b, 0);
        break;
    }
  });

  return scope;
}

export function sanitizeVariableNames(obj) {
  const sanitized = {};
  const mapping = {};

  Object.entries(obj).forEach(([key, value]) => {
    // Convert to lowercase, replace spaces/special chars with underscore, remove non-word characters
    let safeKey = key
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_]/g, '_');

    // Ensure no leading digits (not allowed in mathjs)
    if (/^\d/.test(safeKey)) {
      safeKey = '_' + safeKey;
    }

    sanitized[safeKey] = value;
    mapping[key] = safeKey;
  });

  return { sanitized, mapping };
}

export function sanitizeWord(name) {
  return name.trim().replace(/\s+/g, '_'); // replace spaces with underscores
}

export async function urlToFile(url, filename, mimeType) {
  try {
    const proxiedUrl = `/api/image-proxy?url=${url}`
    const response = await fetch(proxiedUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  } catch (error) {
    console.error("Error converting URL to File object:", error);
    return null;
  }
}

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match?.[2] || null;
}

export function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

export function isObjectInArray(object, array) {
  return array.some((obj)=>{
    return object.id === obj.id
  })
}

export function isUserInArrayBoardTable(user_id, array) {
  return array.some((obj)=>{
    return user_id === obj.user_id
  })
}

export function isUserInArray(user_id, array) {
      return array.some((obj)=>{
        return user_id === obj.id
      })
    }

 export function formatToPostgresUTC(date) {
  return date.toISOString().replace('T', ' ').replace('Z', '+00');
}



 export function enrichColumnValue(rawValue, columns) {
  const column = columns.find(c => c.id === rawValue.column_id);
  return {
    ...rawValue,
    columns: column || null,
  };
}

export function isValidJsonStructure(value) {

  if (value instanceof Date) return false;


  return (
    typeof value === 'object' &&
    value !== null &&
    (Array.isArray(value) || Object.prototype.toString.call(value) === '[object Object]')
  );
}

export function handleFileDownload(imageUrl, fileName){
  // Create a temporary link element
  const link = document.createElement("a")
  link.href = imageUrl
  link.download = fileName
  link.click()
}


export function sendNotifications(users, message) {

    users.forEach(async(userId) => {
      insertNotification(userId, message)
    })

}

export function filterDuplicates(array, property) {
  return array.filter((obj, index, self) =>
    index === self.findIndex((o) => o[property] === obj[property])
  );
}

export function groupMembersByTaskId(selectedMembers) {
  return Object.values(
   selectedMembers.reduce((acc, { userId, taskId }) => {
     if (!acc[taskId]) {
       acc[taskId] = { taskId, userIds: [] };
     }
     acc[taskId].userIds.push(userId);
     return acc;
   }, {})
 );
}

export function isValidURL(urlString) {
  try {
    new URL(urlString); // Attempt to create a URL object
    return true; // If successful, it's a valid URL format
  } catch (error) {
    return false; // If an error occurs, it's not a valid URL
  }
}


export function checkDate(date) {
  const currentDate = new Date();
  const dateToCheck = new Date(date); // Example date

  if (dateToCheck < currentDate) {
      return false
  }else{
      return true
  }
}

export function generateSlug(text) {
  return text
    .toString() // Ensure the input is a string
    .normalize('NFD') // Normalize Unicode characters to decompose them
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove all non-word characters except hyphens
    .replace(/--+/g, '-'); // Replace multiple hyphens with a single hyphen
}

export function dataURLToFile(dataUrl, filename) {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}




const events = [
  { name: 'Event C', date: new Date('2023-03-10') },
  { name: 'Event A', date: new Date('2022-11-25') },
  { name: 'Event B', date: new Date('2023-01-05') }
];

// If 'date' is a Date object:
events.sort((a, b) => a.date - b.date);

const postToLinkedin = () => {
  fetch('/api/linkedin/post', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('linkedin_token')}`,
    },
  });
}

export function trimChatHistory(chatHistory, maxTurns = 10) {
  if (!chatHistory || chatHistory.length === 0) return [];

  const systemMessage = chatHistory[0]?.role === "system" ? chatHistory[0] : null;
  const messages = systemMessage ? chatHistory.slice(1) : chatHistory;

  const turns = [];
  for (let i = 0; i < messages.length; i += 2) {
    const userMsg = messages[i];
    const aiMsg = messages[i + 1];

    if (userMsg?.role === "user" && aiMsg?.role === "assistant") {
      turns.push([userMsg, aiMsg]);
    }
  }

  const trimmedTurns = turns.slice(-maxTurns).flat();

  return systemMessage ? [systemMessage, ...trimmedTurns] : trimmedTurns;
}


/*
const newUsers = users.filter(userId => !existingMemberIds.includes(userId));
*/
