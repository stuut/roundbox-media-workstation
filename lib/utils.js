
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

export function displayFormulaFunction(formula, columns) {
  return columns.reduce((f, col) => {
    const regex = new RegExp(`\\b${col.id}\\b`, 'g'); // \b ensures whole word match
    return f.replace(regex, col.displayName);
  }, formula);
}

export function aggregateColumnValues(columnValues, method = 'sum') {
  const scope = {};

  for (const { displayName, safeName, value } of columnValues) {
    const numericValue = typeof value === 'number' ? value : parseFloat(value);
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


/*
const newUsers = users.filter(userId => !existingMemberIds.includes(userId));
*/
