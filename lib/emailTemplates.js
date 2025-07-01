import { checkDate } from '@/lib/utils'



export function generateTaskEmailHTML(tasks = [], websiteUrl) {
  if (!Array.isArray(tasks) || tasks.length === 0) return '';

  const htmlTasks = tasks.map(task => {
    const { id, title, description, due_date, boards_assigned_to_task } = task.tasks;

    const date = checkDate(task.tasks.due_date)

      let dateStyle
      let style
      let linkStyle

      if (date){
        style='background:rgb(255 218 214); border-radius:25px; padding:25px; margin-bottom: 15px;'
        dateStyle='display:inline-block; margin-right:5px; background: rgb(186 26 26); color: #ffffff; padding:10px 15px 10px 15px; border-radius:25px;'
        linkStyle='text-decoration:none; color:#ffffff'
      }else{
        style='background:rgb(237 237 244); border-radius:25px; padding:25px; margin-bottom: 15px;'
        dateStyle='display:inline-block; margin-right:5px; background: rgb(217 217 224); color: #00000; padding:10px 15px 10px 15px; border-radius:25px;'
        linkStyle='text-decoration:none; color:#000000'
      }



    const boards = boards_assigned_to_task.map((board, index) => {
      return`
        <p style="margin-top: 25px;"><strong> Boards Assigned to Task</strong></p>
        <div style="${dateStyle}">
            <a style="${linkStyle}" href="${websiteUrl}/board/${board.board_id}?task-id=${id}">
              <p style="margin:0px">${board.boards.name}</p>
            </a>
        </div>
      `
     })







    return `
        <div style="${style}">
          <a style="text-decoration:none; color:#000000" href="${websiteUrl}/task/${id}">
            <p style="font-size: 2em;"><strong>${title}</strong></p>
            <p style="font-size: 1.5em;">${description || ''}</p>
          </a>
          ${boards}
        </div>
    `;
  });

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="text-align:center;">🛠️ Today's Tasks</h2>
      ${htmlTasks.join('\n')}
      <p style="font-size: 12px; color: #888;">You are receiving this email because you have tasks assigned to you.</p>
    </div>
  `;
}
