export function generateTaskEmailHTML(tasks = [], websiteUrl) {
  if (!Array.isArray(tasks) || tasks.length === 0) return '';

  const htmlTasks = tasks.map(task => {
    const { id, title, description } = task.tasks;

    return `
      <a style="text-decoration:none; color:#000000" href="${websiteUrl}/task/${id}">
        <div style="background:rgb(237 237 244); border-radius:25px; padding:25px; margin-bottom: 15px;">
          <p style="font-size: 25px;"><strong>${title}</strong></p>
          <p>${description || ''}</p>
        </div>
      </a>
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
