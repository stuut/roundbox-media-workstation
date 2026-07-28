//"use server"
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()

export function getPagination(page, size) {
  const limit = size ? +size : 10
  const from = page ? (page - 1) * limit : 0
  const to = page ? from + limit - 1 : limit - 1

  return { from, to }
}

export async function createWorkspaceWithMember(workspaceData, userId) {
  // Insert new workplace and get the inserted row
  const { data: insertedWorkspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert([workspaceData])
    .select()
    .single();
  if (workspaceError) {
    console.log('workspaceError', workspaceError)
    throw new Error('Failed to create workspace: ' + workspaceError.message);
  }

  // Extract the new workplace id
  const workspaceId = insertedWorkspace.id;

  // Insert a record in workplace_members linking user and workplace
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert([{ workspace_id: workspaceId, user_id: userId }]);

  if (memberError) {
    throw new Error('Failed to add user to workspace_members: ' + memberError.message);
  }

  return insertedWorkspace;
}

export async function createBoard(boardData, users, workspaces) {
  // Insert new workplace and get the inserted row
  const { data: insertedBoard, error: boardError } = await supabase
    .from('boards')
    .insert([boardData])
    .select()
    .single();

  if (boardError) {
    console.log('boardError', boardError)
    throw new Error('Failed to create board: ' + boardError.message);
  }

  // Extract the new workplace id
  const boardId = insertedBoard.id;

  if (users.length>0){
    const insertUserData = users.map((userId) => ({
      board_id: boardId,
      user_id: userId
    }));

    // Insert a record in workplace_members linking user and workplace
    const { error: boardMemberError } = await supabase
      .from('board_members')
      .insert(insertUserData);

    if (boardMemberError) {
      if (boardMemberError.code === '23505') {
        console.warn('Some users were already members');
        // Or filter and retry if needed
      } else {
        throw new Error('Failed to add user to board_members: ' + boardMemberError.message);
      }
    }
  }


  if (workspaces.length>0){

    const insertWorkspacesData = workspaces.map((workspaceId) => ({

      workspace_id: workspaceId,
      board_id: boardId
    }));



    const { error: workspaceBoardsError } = await supabase
      .from('workspace_boards')
      .insert(insertWorkspacesData);

    if (workspaceBoardsError) {
      throw new Error('Failed to add board to workspace boards: ' + workspaceBoardsError.message);
    }

  }

  // Users is an array

  return insertedBoard;
}



export async function createBoardWithMembers(boardData, userIds, workspaceIds) {
  // Insert new workplace and get the inserted row
  const { data: insertedBoard, error: boardError } = await supabase
    .from('boards')
    .insert([boardData])
    .select()
    .single();

  if (boardError) {
    console.log('boardError', boardError)
    throw new Error('Failed to create board: ' + boardError.message);
  }

  // Extract the new workplace id
  const boardId = insertedBoard.id;

  if (users.length>0){
    const insertUserData = users.map((userId) => ({
      board_id: boardId,
      user_id: userId
    }));

    // Insert a record in workplace_members linking user and workplace
    const { error: boardMemberError } = await supabase
      .from('board_members')
      .insert(insertUserData);

    if (boardMemberError) {
      if (boardMemberError.code === '23505') {
        console.warn('Some users were already members');
        // Or filter and retry if needed
      } else {
        throw new Error('Failed to add user to board_members: ' + boardMemberError.message);
      }
    }
  }

  // Users is an array


  const { error: workspaceBoardsError } = await supabase
    .from('workspace_boards')
    .insert([{ board_id: boardId, workspace_id: workspaceId }]);

  if (workspaceBoardsError) {
    throw new Error('Failed to add board to workspace boards: ' + workspaceBoardsError.message);
  }

  return insertedBoard.name;
}

export const insertNewBoardField = async (newField) => {
  try {
    const { data, error } = await supabase
    .from('board_fields')
    .insert([newField])
    .select(); // Optional: get back the inserted row

    if (error) {
      throw error
    }

    return  data
  }catch (error){
    console.log('Failed to insert new field ', error)
  }
}

export const addNewBoardFieldValue = async (newData) => {
  try {
    const { data, error } = await supabase
    .from('board_field_values')
    .insert([newData])
    .select(); // Optional: get back the inserted row

    if (error) {
      throw error
    }

    return  data
  }catch (error){
    console.log('Failed to insert new field ', error)
  }
}

export const updateBoardFieldValue = async (value, id) => {

  try {
    const { data, error } = await supabase
    .from('board_field_values')
    .update({value:value})
    .eq('id', id)
    .select();
      if (error) {
        throw error
      }else{
        console.log('Value saved!');
      }

  }catch (error){
    console.log('Failed to update Board Field Value ', error)
  }
}

export const updateFileDescriptionValue = async (value, id) => {

  try {
    const { data, error } = await supabase
    .from('files')
    .update({file_description:value})
    .eq('id', id)
    .select();
      if (error) {
        throw error
      }else{
        console.log('Value saved!');
      }

  }catch (error){
    console.log('Failed to update Board Field Value ', error)
  }
}


  export const deleteBoardField = async (fieldIds) => {

    try {
        const { data, error } = await supabase
        .from('board_fields')
        .delete()
        .in('id', fieldIds);

        if (error) {
          console.error('Error deleting board field:', error);
        }

        return data
    } catch (error) {
      console.log('Failed to delete board field ', error)
    }

  }

/*
SELECT w.*
FROM workplaces w
JOIN workplace_members wm ON wm.workplace_id = w.id
WHERE wm.user_id = 'USER_ID_HERE';
*/


export const getWorkspace = async (workspaceId) => {
    try {
      const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single(); // throws error if 0 or >1 match

      if (error) {
        throw error
      }

      const workspaces = data.map(entry => entry.workspace);

      return workspaces

    } catch (error) {
      console.log('Failed to fetch assigned workspaces ', error)
    }
}



export const getWorkspaceWithMembers = async (workspaceId) => {

  try {

    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members (
          *,
          user: user_id (*)
        )
      `)
      .eq('id', workspaceId);


    if (error) {
      throw error
    }

    return data

    } catch (error) {
      console.log('Failed to fetch assigned workspaces ', error)
    }

  }

  export const getWorkspaceWithMembersAndBoards = async (workspaceId) => {

    try {

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members (
            *,
            user: user_id (*)
          ),
          workspace_boards (
            *,
            boards: board_id (*)
          )
        `)
        .eq('id', workspaceId);


      if (error) {
        throw error
      }

      return data

    } catch (error) {
      console.log('Failed to fetch assigned workspaces ', error)
    }
    }



/*
SELECT workspaces.*
FROM workspaces
JOIN workspace_members ON workspaces.id = workspace_members.workspace_id
WHERE workspace_members.user_id = '78b04106-5681-4003-bd18-9a328a719b11'
LIMIT 100;
*/



export const getWorkspacesAssignedToUser = async (userId) => {
    try {
      const { data, error } = await supabase
      .from('workspace_members')
      .select('workspaces(*)')
      .eq('user_id', userId)
      .limit(100);


      if (error) {
        throw error
      }

      const workspaces = data.map(entry => entry.workspaces);

        console.log('workspaces', workspaces)

      return workspaces

    } catch (error) {
      console.log('Failed to fecth assigned workspaces ', error)
    }
}



export const getBoard = async (boardId) => {
    try {
      const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single(); // throws error if 0 or >1 match

      if (error) {
        throw error
      }

      const boards = data.map(entry => entry.workspace);

      return  boards

    } catch (error) {
      console.log('Failed to fetch board ', error)
    }
}

export const deleteBoards = async (boardIds) => {
  try {
      const { data, error } = await supabase
      .from('boards')
      .delete()
      .in('id', boardIds);

      if (error) {
        console.error('Error deleting boards', error);
      }

      return data
  } catch (error) {
    console.log('Failed to delete boards ', error)
  }
}

export const deleteWorkspaces = async (workspaceIds) => {
  try {
      const { data, error } = await supabase
      .from('workspaces')
      .delete()
      .in('id', workspaceIds);

      if (error) {
        console.error('Error deleting workspaces', error);
      }

      return data
  } catch (error) {
    console.log('Failed to deleteing workspaces ', error)
  }
}



export const deleteTasks = async (taskIds) => {
  try {
      const { data, error } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIds);

      if (error) {
        console.error('Error deleting tasks', error);
      }

      return data
  } catch (error) {
    console.log('Failed to delete tasks ', error)
  }
}


export const addTasksToBoard = async (boardId, taskIds) => {
  try {

    if (taskIds.length>0){

      const insertTasksData = taskIds.map((taskId) => ({
        task_id: taskId,
        board_id: boardId
      }));


        const { data, error } = await supabase
        .from('board_tasks')
        .insert(insertTasksData);


        if (error) {
          console.error('Error removing members from tasks:', error);
        }

    }


  } catch (error) {
    console.log('Failed to remove members from Tasks ', error)
  }
}




export const removeTasksFromBoard = async (boardId, taskIds) => {
  try {
      const { data, error } = await supabase
      .from('board_tasks')
      .delete()
      .filter('board_id', 'eq', boardId)
      .in('task_id', taskIds);


      if (error) {
        console.error('Error removing members from tasks:', error);
      }

      return data
  } catch (error) {
    console.log('Failed to remove members from Tasks ', error)
  }
}


export const deleteMembersFromWorkspace = async (workspaceId, memberIds) => {
  try {
      const { data, error } = await supabase
      .from('workspace_members')
      .delete()
      .filter('workspace_id', 'eq', workspaceId)
      .in('user_id', memberIds);

      if (error) {
        console.error('Error removing members from workspace:', error);
      }

      return data
  } catch (error) {
    console.log('Failed to remove members from workspace ', error)
  }
}


export const deleteMembersFromBoard = async (boardId, memberIds) => {
  try {
      const { data, error } = await supabase
      .from('board_members')
      .delete()
      .filter('board_id', 'eq', boardId)
      .in('user_id', memberIds);

      if (error) {
        console.error('Error removing members from board', error);
      }

      return data
  } catch (error) {
    console.log('Failed to remove members from board ', error)
  }
}




export const deleteMembersFromTask = async (taskId, memberIds) => {
  try {
      const { data, error } = await supabase
      .from('task_members')
      .delete()
      .filter('task_id', 'eq', taskId)
      .in('user_id', memberIds);

      if (error) {
        console.error('Error removing members from task', error);
      }

      return data
  } catch (error) {
    console.log('Failed to remove members from task ', error)
  }
}

export const getBoardWithColumnsAndTasksMemberFilter = async (boardId, member_ids) => {
  try {

    const { data, error } = await supabase.rpc('get_board_with_filtered_member_ids', {
      board_id: boardId,
      member_ids: member_ids
    });

      if (error) {
        throw error;
      }

    return data;
  } catch (error) {
    console.log('Failed to fetch board ', error);
  }

}

export const getBoardWithColumnsAndTasksColumnValueFilter = async (boardId, column_value) => {
  try {
    const { data, error } = await supabase.rpc('get_board_with_tasks_by_column_value', {
      board_id: boardId,
      column_value: column_value
    });
    if (error) {
      throw error;
    }
    console.log('data', data)
    return data;
  } catch (error) {
    console.log('Failed to fetch board ', error);
  }
}


export const getBoardWithColumnsAndTasksStatusFilter = async (boardId, status) => {
  try {

    const { data, error } = await supabase.rpc('get_board_with_tasks_by_status', {
      board_id: boardId,
      status_filter: status
    });
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.log('Failed to fetch board ', error);
  }

}

export const getBoardMembers = async (boardId) => {
  try {

    const { data, error } = await supabase
    .from('users')
    .select(`*,
      board_members!inner(board_id)
      `)
    .eq('board_members.board_id', boardId);

      if (error) {
        throw error
      }

    return data

  } catch (error) {
    console.log('Failed to fetch board ', error)
  }

}

export const getTaskMembers = async (taskId) => {
  try {

    const { data, error } = await supabase
    .from('users')
    .select(`*,
      members:task_members!inner(task_id)
      `)
    .eq('task_members.task_id', taskId);

      if (error) {
        throw error
      }

    return data

  } catch (error) {
    console.log('Failed to fetch task members ', error)
  }

}




export const getBoardWithColumnsAndTasks = async (boardId) => {
    try {
      const { data, error } = await supabase
      .from('boards')
      .select(`
        *,
        board_fields (
          id,
          name,
          type,
          created_by,
          created_at,
          board_id,
          board_field_values (
            id,
            board_field_id,
            value,
            type,
            file_id
          )
        ),
        columns (
          id,
          name,
          type,
          position
        ),
        tasks (
          id,
          title,
          description,
          status,
          created_by,
          created_at,
          members: task_members (
            user_id,
            users (
              full_name,
              avatar_url
            )
          ),
          created_by_user: users!tasks_created_by_fkey (
            id,
            full_name,
            avatar_url
          ),
          column_values (
            id,
            type,
            value,
            board_id,
            created_at,
            task_id,
            column_id,
            file_id,
            label,
            is_recurring,
            recurrence,
            recurrence_days,
            date_format,
            data,
            column_select_options(
              id,
              value,
              colour,
              order
            ),
            columns (
              id,
              name,
              type,
              position
            ),
            files(
              id,
              file_url,
              file_type,
              file_name
            )
          )
        ),
        workspace_boards(
        workspace_id
        )
      `)
      .eq('id', boardId);
      if (error) {
        throw error
      }

      return data

    } catch (error) {
      console.log('Failed to fetch board ', error)
    }
}


/*
const newColumn = {
  name: 'Reach',
  type: 'number',
  board_id: 'your-board-id-here'
};
*/




export const queryColumnValues = async (query, board_id, type) => {

    try {

      const { data, error } = await supabase
      .from('column_values')
      .select(`
        id,
        value,
        type,
        board_id
      `,{ distinct: true })
      .ilike('value', `%${query}%`) // Case-insensitive partial match
      .eq('board_id', board_id)
      .eq('type', type)
      .limit(10); // optional: limit results for autosuggest performance
      if (error) {
        throw error
      }

      console.log('data.length', data.length)
      return  data

    }catch (error){
      console.log('Failed to fetch column ', error)
    }
}

export const checkBoardFieldName = async (fieldName, boardId) => {

  try {

    const { data, error } = await supabase
    .from('board_fields')
    .select(`
      id,
      name,
      board_id
    `)
    .eq('board_id', boardId)
    .eq('name', fieldName)
    .select();

    if (error) {
      throw error
    }

    return  data

  }catch (error){
    console.log('Failed to fetch column ', error)
  }

}


export const checkColumnName = async (columnName, boardId) => {

  try {

    const { data, error } = await supabase
    .from('columns')
    .select(`
      id,
      name,
      board_id
    `)
    .eq('board_id', boardId)
    .eq('name', columnName)
    .select();

    if (error) {
      throw error
    }

    return  data

  }catch (error){
    console.log('Failed to fetch column ', error)
  }

}





export const getColumnValues = async (columnValueId) => {

  try {

    const { data, error } = await supabase
    .from('column_values')
    .select(`
      id,
      value,
      type,
      board_id,
      created_at,
      task_id,
      column_id,
      file_id,
      label,
      is_recurring,
      recurrence,
      recurrence_days,
      date_format,
      data,
      column_select_options(
        id,
        value,
        colour,
        order
      ),
      columns (
          id,
          name,
          type,
          position
      ),
      files(
        id,
        file_url,
        file_type,
        file_name
      )
    `)
    .eq('id', columnValueId)

    if (error) {
      throw error
    }

    return  data[0]

  }catch (error){
    console.log('Failed to fetch column ', error)
  }

}

export const insertNewColumn = async (newColumnData) => {
  try {
    const { data, error  } = await supabase
    .from('columns')
    .insert([newColumnData])
    .select()
    .single();


    if (error) {
      console.error('Error creating column:', error);
    }

    return data

  }catch (error){
    console.log('Failed to create column ', error)
  }
}

export const deleteCustomColumns = async (columnIds) => {
  console.log('deleteCustomColumns', columnIds)

  try {
      const { data, error } = await supabase
      .from('columns')
      .delete()
      .in('id', columnIds);

      if (error) {
        console.error('Error deleting column:', error);
      }

      return data
  } catch (error) {
    console.log('Failed to delete colum ', error)
  }

}

/*
const newColumnValues = {
board_id: 'bt-id-for-this-task',
task_id: 'bt-id-for-this-task',
column_id: '4017bf84-583c-4767-b7b2-13fefc901a8f',
value: '12345'
}
*/

export const deleteColumnValues = async (ids) => {

  try {
      const { data, error } = await supabase
      .from('column_values')
      .delete()
      .in('id', ids);

      if (error) {
        console.error('Error deleting col values:', error);
      }

      return data
  } catch (error) {
    console.log('Failed to delete col values ', error)
  }

}

export const updateBoardFieldName = async (value, id) => {

  try {
    const { data, error } = await supabase
    .from('board_fields')
    .update({name:value})
    .eq('id', id)
    .select();
      if (error) {
        throw error
      }else{
        console.log('Value saved!');
      }

  }catch (error){
    console.log('Failed to update board field name ', error)
  }
}


export const updateColumnName = async (value, id) => {

  try {
    const { data, error } = await supabase
    .from('columns')
    .update({name:value})
    .eq('id', id)
    .select();
      if (error) {
        throw error
      }else{
        console.log('Value saved!');
      }

  }catch (error){
    console.log('Failed to update column name ', error)
  }
}


export const updateColumnValueDate = async (newData, id) => {

  try {
    const { data, error } = await supabase
    .from('column_values')
    .update(newData)
    .eq('id', id);
      if (error) {
        throw error
      }else{
        console.log('Value saved!');
      }

  }catch (error){
    console.log('Failed to update new column ', error)
  }
}


export const updateColumnValueData = async (value, id) => {

  try {
    const { data, error } = await supabase
    .from('column_values')
    .update({data:value})
    .eq('id', id);

      if (error) {
        throw error
      }else{
        console.log('Value saved!');
      }

  }catch (error){
    console.log('Failed to update new column ', error)
  }
}




export const updateColumnValue = async (value, id) => {
  console.log(value, id)

  try {
    const { data, error } = await supabase
    .from('column_values')
    .update({value:value})
    .eq('id', id);
      if (error) {
        throw error
      }else{
        console.log('Value saved!');
      }

  }catch (error){
    console.log('Failed to update new column ', error)
  }
}



export const storeFileInfo = async (fileInfo) => {


  try {
    const { data, error } = await supabase
    .from('files')
    .insert([fileInfo])
    .select()
    .single();

      if (error) {
        throw error
      }

      return data

  }catch (error){
    console.log('Failed to store file info ', error)
  }
}


export const deleteFiles = async (fileIds) => {

  try {
    const { data, error } = await supabase
    .from('files')
    .delete()
    .in('id', fileIds);

      if (error) {
        throw error
      }

  }catch (error){
    console.log('Failed to delete  file  ', error)
  }
}



export const uploadFilesPublic = async (filePath, file) => {

    try {

      const { data, error: uploadError } = await supabase
        .storage
        .from('public-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData, error: publicUrlError } = supabase
        .storage
        .from('public-files')
        .getPublicUrl(filePath);

      if (publicUrlError) throw publicUrlError;

      data.publicUrl = publicUrlData.publicUrl

      return data


    }catch (error){
      console.log('Failed to create new column value', error)

    }

}

export const addNewColumnValueData = async (newData) => {

  console.log('addNewColumnValue', newData)

  try {

    const { data: newColumnValue, error: newColumnValueError } = await supabase
    .from('column_values')
    .insert([newData])

    if (newColumnValueError) {
      console.log('new column error', newColumnValueError)
      throw new Error('Failed to create column value: ' + newColumnValueError.message);
    }


  }catch (error){
    console.log('Failed to create new column value', error)

  }

}

export const insertNewColumnValues = async (newColumnValues) => {

  try {
    const { data, error } = await supabase
    .from('column_values')
    .upsert(newColumnValues);

      if (error) {
        throw error
      }else{
        console.log('Value saved!');
      }

  }catch (error){
    console.log('Failed to update new column ', error)
  }

}









export const addNewColumnValue = async (newData, dropDownList) => {

  console.log('addNewColumnValue', newData)

  try {

    const { data: newColumnValue, error: newColumnValueError } = await supabase
    .from('column_values')
    .insert([newData])
    .select()
    .single();

    if (newColumnValueError) {
      console.log('new column error', newColumnValueError)
      throw new Error('Failed to create column value: ' + newColumnValueError.message);
    }

    const newColumnValueId = newColumnValue.id;

    if (dropDownList && dropDownList.length > 0){

      const insertdropdownData = dropDownList.map((value, index) => ({
        column_values_id: newColumnValueId,
        value: value,
        order: index+1
      }));

      const { error: columnSelectError } = await supabase
        .from('column_select_options')
        .insert(insertdropdownData);

        if (columnSelectError) {
          throw new Error('Failed to add dropdown options: ' + columnSelectError.message);
        }
    }

  }catch (error){
    console.log('Failed to create new column value', error)

  }

}




export const getBoardWithWorkspace = async (boardId) => {
    try {
      const { data, error } = await supabase
      .from('boards')
      .select(`
        *,
        workspace_boards(
        *,
        workspaces: workspace_id (*)
        )
      `)
      .eq('id', boardId)

      if (error) {
        throw error
      }

      return  data

    } catch (error) {
      console.log('Failed to fetch board ', error)
    }
}

export const getBoardsAssignedToUser = async (userId) => {

    try {
      const { data, error } = await supabase
      .from('board_members')
      .select('boards(*)')
      .eq('user_id', userId)
      .limit(100);

      if (error) {
        throw error
      }

      const boards = data.map(entry => entry.boards);

      return boards

    } catch (error) {
      console.log('Failed to fecth assigned workspaces ', error)
    }
}

export const getBoardsAssignedToWorkspace = async (workspaceId) => {

    try {
      const { data, error } = await supabase
      .from('workspace_boards')
      .select('boards(*)')
      .eq('workspace_id', workspaceId)
      .limit(100);

      if (error) {
        throw error
      }

      const boards = data.map(entry => entry.boards);

      return boards

    } catch (error) {
      console.log('Failed to fecth assigned workspaces ', error)
    }
}




 //Get All Tasks for a Given board_id and user_id

 /*
 SELECT tasks.*
FROM tasks t
JOIN board_tasks bt ON t.id = bt.task_id
JOIN task_users tu ON t.id = tu.task_id
WHERE bt.board_id = 'your_board_id_here'
  AND tu.user_id = 'your_user_id_here';
  */


  export async function createTask(taskData, users, boards, workspaces) {
    // Insert new workplace and get the inserted row
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (taskError) {
      console.log('workspaceError', taskError)
      throw new Error('Failed to create task: ' + taskError.message);
    }

    // Extract the new workplace id
    const taskId = newTask.id;

    // insert Users array
    if (users.length >0){
      const insertUserData = users.map((userId) => ({
        task_id: taskId,
        user_id: userId
      }));

      const { error: taskMembersError } = await supabase
        .from('task_members')
        .insert(insertUserData);

      if (taskMembersError) {
        throw new Error('Failed to assigned task to members: ' + taskMembersError.message);
      }
    }


    if (boards.length > 0){
        const insertBoardData = boards.map((boardId) => ({
          task_id: taskId,
          board_id: boardId
        }));

        const { error: boardTaskError } = await supabase
          .from('board_tasks')
          .insert(insertBoardData);

        if (boardTaskError) {
          throw new Error('Failed to add task to board: ' + boardTaskError.message);
        }
    }


    if (workspaces.length > 0){


      const insertWorkspaceData = workspaces.map((workspaceId) => ({
        task_id: taskId,
        workspace_id: workspaceId
      }));

      const { error: workspaceTaskError } = await supabase
        .from('workspace_tasks')
        .insert(insertWorkspaceData);

      if (workspaceTaskError) {
        throw new Error('Failed to add task to workspace: ' + workspaceTaskError.message);
      }

    }



    return newTask;
  }

  export const insertWorkspaceMembers = async (workspaceId, users) => {
    try{
      if (users.length >0){

        const insertUserData = users.map((userId) => ({
          workspace_id: workspaceId,
          user_id: userId
        }));

        const { error: workspaceMembersError } = await supabase
          .from('workspace_members')
          .insert(insertUserData);

        if (workspaceMembersError) {
          throw new Error('Failed to add members to workspace: ' + workspaceMembersError.message);
        }
      }
    }catch (error){
      throw new Error('Failed to add members to workspace: ' + error);

    }
  }

  export const insertBoardMembers = async (boardId, users) => {
    try{
      if (users.length >0){

        const insertUserData = users.map((userId) => ({
          board_id: boardId,
          user_id: userId
        }));

        const { error: taskMembersError } = await supabase
          .from('board_members')
          .insert(insertUserData);

        if (taskMembersError) {
          throw new Error('Failed to add members to board ' + taskMembersError.message);
        }
      }
    }catch (error){
      throw new Error('Failed to add members to board ' + error);
    }
  }



  export const insertTaskMembers = async (taskId, users) => {
    try{
      if (users.length >0){

        const insertUserData = users.map((userId) => ({
          task_id: taskId,
          user_id: userId
        }));

        const { error: taskMembersError } = await supabase
          .from('task_members')
          .insert(insertUserData);

        if (taskMembersError) {
          throw new Error('Failed to add members to task: ' + taskMembersError.message);
        }
      }
    }catch (error){
      throw new Error('Failed to add members to task: ' + error);
    }
  }

  export const updateBoardColumn = async (boardId, column, value) => {

    const updateObj = { [column]: value };

    try{
      const { data, error } = await supabase
        .from('boards')
        .update(updateObj)
        .eq('id', boardId)
        .select();

        if (error) {
          console.error('Error updating board', error.message);
        }

      }catch (error){
        console.log('Error updating board', error)
      }
  }

  export const updateWorkspaceColumn = async (workspaceId, column, value) => {

    const updateObj = { [column]: value };

    try{
      const { data, error } = await supabase
        .from('workspaces')
        .update(updateObj)
        .eq('id', workspaceId)
        .select();

        if (error) {
          console.error('Error updating workspace', error.message);
        }

      }catch (error){
        console.log('Error updating workspace', error)
      }
  }



  export const updateTaskColumn = async (taskId, column, value) => {

    const updateObj = { [column]: value };

    try{
      const { data, error } = await supabase
        .from('tasks')
        .update(updateObj)
        .eq('id', taskId)
        .select();

        if (error) {
          console.error('Error updating task', error.message);
        } else {
          console.log('Update successful', data);
        }

      }catch (error){
        console.log('Error updating task', error)
      }
  }

  export const getFile = async (fileId) => {
    try{
        const { data, error } = await supabase
        .from('files')
        .select(`
          files(
            id,
            file_url
          )
        `)
        .eq('id', fileId)

        if (error) {
          throw error
        }


    }catch (error){
      console.log('Error getting file', error)
    }
  }

  export const getFiles = async (userId, file_types=['image/png', 'image/jpeg'], currentPage) => {

    const { from, to } = getPagination(currentPage, 50);


    try{
        const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .in('file_type', file_types)
        .order('created_at', { ascending: false })
        .range(from, to);
        //.limit(50) // batch size

        if (error) {
          throw error
        }

        return data
    }catch (error){
      console.log('Error getting files', error)
    }

  }

  export const getFilesSearch =  async (userId, text, file_types=['image/png', 'image/jpeg']) => {

    try{

      const { data, error } = await supabase
      .from('files')
      .select('*')
      .textSearch('file_description', text, { type: 'websearch' })
      .eq('user_id', userId)
      .in('file_type', file_types)
      .order('created_at', { ascending: false })
      .limit(100) // batch size

      if (error) {
        throw error
      }

      return data

    }catch (error){
      console.log('Error getting files', error)
    }

  }

  export const getTask = async (taskId) => {
    try{
      const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        created_by,
        created_at,
        members:task_members (
          user_id,
          users (
            id,
            full_name,
            avatar_url
          )
        ),
        created_by_user: users!tasks_created_by_fkey (
          id,
          full_name,
          avatar_url
        ),
        boards_assigned_to_task: board_tasks(
          *,
          boards(
            id,
            name,
            workspace_id: workspace_boards(
              workspace_id
            )
          )
        ),
        column_values (
          id,
          value,
          type,
          board_id,
          created_at,
          task_id,
          column_id,
          file_id,
          label,
          is_recurring,
          recurrence,
          recurrence_days,
          date_format,
          data,
          column_select_options(
            id,
            value,
            colour,
            order
          ),
          columns (
              id,
              name,
              type,
              position
          ),
          files(
            id,
            file_url,
            file_type,
            file_name
          )
        )
      `)
      .eq('id', taskId)
      .single();

      if (error) {
        throw error
      }
      return data

    }catch (error){
      console.log('Error getting task', error)
    }
  }


  export const getTaskCreatedBy =  async (userId) => {
    try{
      const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        members:task_members (
          user_id,
          users (
            full_name,
            avatar_url
          )
        ),
        created_by_user: users!tasks_created_by_fkey (
          id,
          full_name,
          avatar_url
        ),
        boards_assigned_to_task: board_tasks(
          *,
          boards(
            id,
            name
          )
        )
      `)
      .eq('created_by', userId)
      .single();

      if (error) {
        throw error
      }
      return data

    }catch (error){
      console.log('Error getting task', error)
    }
  }


  export const getBoardsCreatedByUser = async (userId) => {
    try{
      const { data, error } = await supabase
      .from('boards')
      .select(`*`)
      .eq('created_by', userId)

      if (error) {
        console.log('error', error)
        throw error
      }

      return data

    }catch (error){
      console.log('Error getting boards', error)
    }
  }

  export const getWorkspacesCreatedByUser = async (userId) => {
    try{
      const { data, error } = await supabase
      .from('workspaces')
      .select(`*`)
      .eq('created_by', userId)

      if (error) {
        console.log('error', error)
        throw error
      }

      return data

    }catch (error){
      console.log('Error getting workspaces', error)
    }
  }



export const getTasksCreatedByUser = async (userId) => {
  try{
    const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      created_by_user: users!tasks_created_by_fkey (
        id,
        full_name,
        avatar_url
      ),
      boards_assigned_to_task: board_tasks(
        *,
        boards(
          id,
          name
        )
      )
    `)
    .eq('created_by', userId)

    if (error) {
      console.log('error', error)
      throw error
    }

    return data

  }catch (error){
    console.log('Error getting task', error)
  }
}

export const getWorkspaceWithUserIdWorkspaceId = async (userId, workspaceId) => {
  try{
    const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      workspaces(
        *,
        created_by_user: users!workspaces_created_by_fkey (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId);

    if (error) {
      console.log('error', error)
      throw error
    }

    if (data){
      const flatWorkspaces = data.map((item) => ({
        ...item.workspaces,         // All task fields
      }));

      return flatWorkspaces[0]
    }

  }catch (error){
    console.log('Error getting task', error)
  }

}

export const getBoardWithUserIdBoardId = async (userId, boardId) => {
  try{
    const { data, error } = await supabase
    .from('board_members')
    .select(`
      boards(
        *,
        created_by_user: users!boards_created_by_fkey (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .eq('board_id', boardId);

    if (error) {
      console.log('error', error)
      throw error
    }

    if (data){
      const flatBoards = data.map((item) => ({
        ...item.boards,         // All task fields
      }));

      return flatBoards[0]
    }

  }catch (error){
    console.log('Error getting task', error)
  }

}




  export const getTaskWithUserIdTaskId = async (userId, taskId) => {
    try{
      const { data, error } = await supabase
      .from('task_members')
      .select(`
      tasks(
      *,
      created_by_user: users!tasks_created_by_fkey (
        id,
        full_name,
        avatar_url
      ),
      boards_assigned_to_task: board_tasks(
        *,
        boards(
          id,
          name
        )
      )
      )
      `)
      .eq('user_id', userId)
      .eq('task_id', taskId);

      if (error) {
        console.log('error', error)
        throw error
      }

      if (data){
        const flatTasks = data.map((item) => ({
          ...item.tasks,         // All task fields
        }));

        return flatTasks[0]
      }

    }catch (error){
      console.log('Error getting task', error)
    }

  }


  export const getTasksAssignedToUser = async (userId) => {
    try{
      const { data, error } = await supabase
      .from('task_members')
      .select(`
        tasks(
        *,
        created_by_user: users!tasks_created_by_fkey (
          id,
          full_name,
          avatar_url
        ),
        boards_assigned_to_task: board_tasks(
          task_id,
          board_id,
          boards(
            id,
            name
          )
         )
        )
      `)
      .eq('user_id', userId)

      if (error) {
        console.log('error', error)
        throw error
      }

      const flatTasks = data.map((item) => ({
        ...item.tasks,         // All task fields
      }));

      return flatTasks

    }catch (error){
      console.log('Error getting task', error)
    }
  }





export const updateTaskDueDate = async (taskId, date) => {

  try{
    const { data, error } = await supabase
      .from('tasks')
      .update({ due_date: date })
      .eq('id', taskId)
      .select();

      if (error) {
        console.error('Error updating task due date:', error.message);
      } else {
        console.log('Update successful:', data);
      }

    }catch (error){
      console.log('Error updating task due date: ', error)
    }

}

export const getTasksForBoard = async (boardId) => {
    try {
      const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        column_values!inner(
          *
        ),
        board_tasks!inner(
          board_id
        )
      `)
      .eq('board_tasks.board_id', boardId)

      if (error) {
        throw error
      }
      return data
    } catch (error) {
      console.log('Error downloading image: ', error)
    }
}


export const getTasksForBoardAssignedToUser = async () => {
    try {
      const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        board_tasks!inner(board_id),
        task_users!inner(user_id)
      `)
      .eq('board_tasks.board_id', yourBoardId)
      .eq('task_users.user_id', yourUserId);

      if (error) {
        throw error
      }
      return data
    } catch (error) {
      console.log('Error downloading image: ', error)
    }
}


//Get All Users Assigned to a Task

/*
SELECT users.*
FROM users
JOIN task_users ON users.id = task_users.user_id
WHERE task_users.task_id = 'your_task_id_here';
*/

export const getUser = async (userId) => {

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);

    if (error) {
      throw error
    }
    return data[0]
  } catch (error) {
    console.log('Error getting user: ', error)
  }

}




export const getUserBoardUpdate = async (userId) => {

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        avatar_url,
        full_name
        `)
      .eq('id', userId);

    if (error) {
      throw error
    }
    return data[0]
  } catch (error) {
    console.log('Error getting user: ', error)
  }

}

export const getAllUsersAssignedToATask = async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, task_users!inner(task_id)')
        .eq('task_users.task_id', taskId);

      if (error) {
        throw error
      }
      return data
    } catch (error) {
      console.log('Error downloading image: ', error)
    }
}

export const getAllUsersAssignedToWorkspace = async (workspaceId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`*,
          workspace_members!inner(workspace_id)
          `)
        .eq('workspace_members.workspace_id', workspaceId);

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.log('Error getting users assigned to workspace: ', error)
    }
}


export const getAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.log('Error getting users: ', error)
    }
}

export const getAllConversationsforaUser = async (userId) => {

try {
      const { data, error } = await supabase
      .from('conversation_members')
      .select(`
        conversation:conversation_id (
          id,
          created_at,
          messages (
            id,
            content,
            sender_id,
            created_at,
            sender:users (
              full_name,
              avatar_url
            )
          ),
          conversation_members (
            user_id,
            users(
              id,
              full_name,
              avatar_url
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', {
        referencedTable: 'conversation.messages',
        ascending: true
      });

      if (error) {
        throw error
      }
      console.log('data', data)
      return data

  } catch (error) {
    console.log('Error downloading image: ', error)
  }
}

export const createConversation = async (memberIds) => {

    try {
            // Step 1: Create new conversation
            const { data: convoData, error: convoError } = await supabase
              .from('conversations')
              .insert({})
              .select('id')
              .single();

            if (convoError || !convoData) throw new Error('Failed to create conversation');

            const conversationId = convoData.id;

            // Step 2: Add members
            const membersPayload = memberIds.map(user_id => ({ user_id, conversation_id: conversationId }));

            const { error: membersError } = await supabase
              .from('conversation_members')
              .insert(membersPayload);

            if (membersError) throw new Error('Failed to add members to conversation');

            return conversationId;

        } catch (error) {
          console.log('Error downloading image: ', error)
        }
}

export const getMessagesInConversation  = async (conversationId) => {
  try {

    const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      sender_id,
      created_at,
      sender:sender_id ( email )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

    if (error) {
      throw error
    }
    console.log('data', data)
    return data

  } catch (error) {
    console.log('Error downloading image: ', error)
  }

}



export const InsertMessage = async (conversationId, userId) => {

  try {
    const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: 'Hello!'
    });

    if (error) {
      throw error
    }


  } catch (error) {
    console.log('Error downloading image: ', error)
  }

}

export const insertNotification = async (userId, message) => {

  try {
    const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      message: message
    });

    if (error) {
      throw error
    }


  } catch (error) {
    console.log('Error downloading image: ', error)
  }

}

export const getNotifications = async (userId) => {

  try {
    const { data, error } = await supabase
    .from('notifications')
    .select(`*`)
    .eq('user_id', userId);

    if (error) {
      throw error
    }

    return data


  } catch (error) {
    console.log('Error downloading image: ', error)
  }

}

export const deleteNotification = async (id) => {
  try {
      const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

      if (error) {
        console.error('Error deleting notification', error);
      }

  } catch (error) {
    console.log('Failed to delete notification ', error)
  }
}



export async function makeFolderPublic(folderPath) {
  console.log('makeFolderPublic', folderPath)


    const { data, error } = await supabase
        .storage
        .from('files')
        .list(folderPath);

    if (error) {
        console.error('Error listing files:', error);
        return;
    }

    for (const file of data) {
        const { error: publicError } = await supabase
            .storage
            .from('files')
            .updatePublic(file.name, folderPath);

        if (publicError) {
            console.error(`Error making ${file.name} public:`, publicError);
        } else {
            console.log(`${file.name} is now public.`);
        }
    }
}

export const getInstagramPages = async (userId) => {
  try {
    const { data, error } = await supabase
    .from('instagram_accounts')
    .select(`*`)
   // .eq('user_id', userId)


      if (error) {
        throw error
      }

      return data

  }catch (error){
    console.log('Failed to get instagram ', error)
  }
}

export const getFacebookPages = async (userId) => {
  try {
    const { data, error } = await supabase
    .from('facebook_accounts')
    .select(`*`)
   // .eq('user_id', userId)


      if (error) {
        throw error
      }

      return data

  }catch (error){
    console.log('Failed to get facebook ', error)
  }
}

export const getFacebookAccessToken = async (userId) => {

  try {
    const { data, error } = await supabase
    .from('facebook_api')
    .select(`*`)
    .single()
    //.eq('user_id', userId)


      if (error) {
        throw error
      }

      return data

  }catch (error){
    console.log('Failed to update new file column ', error)
  }
}

export const getChannels = async (userId) => {

  try {
    const { data, error } = await supabase
    .from('platform_accounts')
    .select(`*`)
    //.eq('user_id', userId)


      if (error) {
        throw error
      }

      return data

  }catch (error){
    console.log('Failed to get channels ', error)
  }
}

export const getChannelsFilter = async (userId, channelIds) => {

  try {
    const { data, error } = await supabase
    .from('platform_accounts')
    .select(`*`)
    .in('id', channelIds)
    //.eq('user_id', userId)


      if (error) {
        throw error
      }

      return data

  }catch (error){
    console.log('Failed to get channels ', error)
  }
}



export const saveAiChatConversation = async (conversationId, chatHistory, displayHistory, userId) => {

  try {
    const payload = {
      display_history: displayHistory,
      chat_history: chatHistory,
      user_id: userId
    };

    // Only add id if it's truthy (not null or undefined)
    if (conversationId) {
      payload.id = conversationId;
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .upsert([payload])
      .select();

    console.log('Supabase response:', { data, error });

    if (error) throw error;

    return data?.[0]?.id;

  } catch (error) {
    console.error('Failed to save conversation:', error);
    return null;
  }
};

export const getAiConversations = async (userId) => {


  try {
    const { data, error } = await supabase
    .from('ai_conversations')
    .select(`*`)
    .eq('user_id', userId)


      if (error) {
        throw error
      }

    return data

  }catch (error){
    console.log('Failed to save conversation ', error)
  }
}

export async function createTemplate(templateData) {
  // Insert new workplace and get the inserted row
  const { data: insertedTemplate, error: templateError } = await supabase
    .from('templates')
    .insert([templateData])


  if (templateError) {
    console.log('template Error', templateError)
    throw new Error('Failed to create template: ' + templateError);
  }

  return insertedTemplate;

}

export async function getTemplates(userId) {

  try{
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)


    if (error) {
      throw new Error('Failed to get templates: ' + error);
    }

    return data;

  }catch (error){
    console.log('Error getting templates', error)
  }

}

export async function getPosts(userId) {

  try{
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_files (
          id,
          file_id,
          files (*)
        )
      `)
      .eq('user_id', userId)


    if (error) {
      throw new Error('Failed to get posts: ' + error);
    }

    return data;

  }catch (error){
    console.log('Error getting posts', error)
  }

}


export async function savePost(postData){

  try{

    const { data: post, error: postError } = await supabase
    .from('posts')
    .insert([postData])
    .select()
    .single()

    if (postError)  {
      throw new Error('Failed to save post: ' + postError);
    }

  return post;

  }catch (error){
    console.log('Error saving posts', error)
  }

}

export async function deletePostFiles(ids){

  console.log('deletePostFiles', ids)

  try{

    const { data, error } = await supabase
    .from('post_files')
    .delete()
    .in('id', ids);

    if (error)  {
      throw new Error('Error removing post files ' + error);
    }

  }catch (error){
    console.log('Error removing post files', error)
  }

}

export async function savePostFile(postFileData){

  try{

    const { data: postFile, error: postFileError } = await supabase
    .from('post_files')
    .insert([postFileData])
    .select()
    .single()

    if (postFileError)  {
      throw new Error('Failed to save post file: ' + postFileError);
    }

  return postFile;

  }catch (error){
    console.log('Error saving posts', error)
  }

}

export async function savePostPublications(publications){

  try{

    const { data: postPublications, error: postPublicationsError } = await supabase
    .from('post_publications')
    .insert(publications)
    .select()


    if (postPublicationsError)  {
      throw new Error('Failed to save post publications: ' + postPublicationsError);
    }

  return postPublications;

  }catch (error){
    console.log('Error saving post publications', error)
  }

}

export async function updatePost(postId, data){

  try{

    const { data: updatePost, error: updatePostError } = await supabase
    .from('posts')
    .update([data])
    .eq('id', postId)
    .select();


    if (updatePostError)  {
      throw new Error('Failed to update publications status: ' + updatePostError);
    }


  }catch (error){
    console.log('Error updating post', error)
  }

}

export async function updatePostPublication(publicationId, data){

  try{

    const { data: updatePublication, error: updatePublicationError } = await supabase
    .from('post_publications')
    .update([data])
    .eq('id', publicationId)
    .select();


    if (updatePublicationError)  {
      throw new Error('Failed to update publications status: ' + updatePublicationError);
    }


  }catch (error){
    console.log('Error updating publications status', error)
  }

}

export async function deletePost(postIds){

  try{

    const { data, error } = await supabase
    .from('post_publications')
    .delete()
    .in('id', postIds);

    if (error) {
      console.error('Error deleting posts:', error);
    }

    return data

  }catch (error){
    console.log('Error deleting posts', error)
  }


}

export async function updatePostFilesSortOrder(sortOrderUpdate){

 try{

    const { data, error } = await supabase
      .from('post_files')
      .upsert(sortOrderUpdate);

      if (error) {
        console.error('Error updating sort order', error);
      }

  }catch (error){
    console.log('Error updating sort order', error)
  }

}


export async function getAllPosts(){
  try{
    const { data: posts, error } = await supabase
      .from("post_publications")
      .select(
        `
        id,
        scheduled_at,
        published_at,
        status,
        title,
        caption,
        type,
        link,
        slug,
        base_url,
        last_error,
        meta_data,
        post_files: post_files(
          id,
          sort_order,
          post_publication_id,
          file_id:files(*)
        ),
        platform_account:platform_accounts (
          id,
          platform,
          external_account_id,
          metadata
        )
      `
      )
      .limit(1000) // batch size

    if (error) throw error

    if (!posts || posts.length === 0) {
      return []
    }

    return posts
  }catch (error){
    console.log('Error fecthing posts', error)
  }
}
export async function updatePostScheduleDate(date, id){
  try{

    const { data, error } = await supabase
        .from("post_publications")
        .update({ scheduled_at: date })
        .eq("id", id)

        if (error) {
          throw error
        }

    }catch (error){
      console.log('Error updating post schedule date', error)
    }
}

export async function getPostsWithIds(ids){
  try{
    const { data: posts, error } = await supabase
      .from("post_publications")
      .select(
        `
        id,
        scheduled_at,
        published_at,
        status,
        title,
        caption,
        type,
        link,
        slug,
        base_url,
        last_error,
        meta_data,
        post_files: post_files(
          id,
          sort_order,
          post_publication_id,
          file_id:files(*)
        ),
        platform_account:platform_accounts (
          id,
          platform,
          access_token,
          external_account_id,
          metadata
        )
      `
      )
      .in('id', ids);

    if (error) throw error

    if (!posts || posts.length === 0) {
      return []
    }


    return posts

  }catch (error){
    console.log('Error fecthing posts', error)
  }
}


export async function getPostsWithDate(date){
  try{
    const { data: jobs, error } = await supabase
      .from("post_publications")
      .select(
        `
        id,
        scheduled_at,
        published_at,
        status,
        title,
        caption,
        type,
        last_error,
        meta_data,
        post_files: post_files(
          id,
          sort_order,
          post_publication_id,
          file_id:files(*)
        ),
        platform_account:platform_accounts (
          id,
          platform,
          access_token,
          external_account_id,
          metadata
        )
      `
      )
      .eq("status", "scheduled")
      .lte("scheduled_at", date)
      .limit(10) // batch size

    if (error) throw error

    if (!jobs || jobs.length === 0) {
      return []
    }
  }catch (error){
    console.log('Error fecthing posts', error)
  }
}

export async function getAllPostsSocialFilter(platformIds){
  try{
    const { data: posts, error } = await supabase
      .from('post_publications')
      .select(
        `
        id,
        scheduled_at,
        published_at,
        status,
        title,
        caption,
        type,
        last_error,
        meta_data,
        link,
        slug,
        base_url,
        post_files: post_files(
          id,
          sort_order,
          post_publication_id,
          file_id:files(*)
        ),
        platform_account:platform_accounts (
          id,
          platform,
          external_account_id,
          metadata
        )
      `
      )
      .in('platform_id', platformIds)
      .limit(1000) // batch size


    if (error) throw error

    // IMPORTANT: always return a consistent type
    if (!posts || posts.length === 0) {
      return []
    }

    return posts
  }catch (error){
    console.log('Error fecthing posts', error)
  }
}

export async function getFeeds(userId){

  try{

      const { data, error } = await supabase
      .from('feeds')
      .select(`
        id,
        label,
        website,
        CMSType,
        scheduleDate,
        publishedDate,
        slug,
        title,
        image,
        text,
        facebook_page_id,
        content_type,
        CTA_image,
        customFilterField,
        query_type,
        query_field,
        postType,
        query_id_field,
        query_link_field,
        query_image_field,
        useDateFilter,
        useEventImport,
        addComment,
        files(*)
        `)
      //.eq('user_id', userId)

      if (error) throw error

      if (!data || data.length === 0) {
        return []
      }

      return data
  }catch (error){
    console.log('Error fecthing feeds', error)
  }

}

export async function getPublishFeeds(userId){

  try{

      const { data, error } = await supabase
      .from('feeds')
      .select(`
        id,
        label,
        website,
        CMSType,
        scheduleDate,
        publishedDate,
        slug,
        title,
        image,
        text,
        facebook_page_id,
        content_type,
        CTA_image,
        customFilterField,
        query_type,
        query_field,
        postType,
        query_id_field,
        query_link_field,
        query_image_field,
        useDateFilter,
        useEventImport,
        addComment,
        files(*)
        `)
      //.eq('user_id', userId)
      .eq('publish_to', true)

      if (error) throw error

      if (!data || data.length === 0) {
        return []
      }

      return data
  }catch (error){
    console.log('Error fecthing feeds', error)
  }

}



export async function addFeed(data){

  try{

      const { data, error } = await supabase
      .from('feeds')
      .upsert(data)

      if (error) throw error

  }catch (error){
    console.log('Error fecthing feeds', error)
  }

}





// Call the function with your folder path
