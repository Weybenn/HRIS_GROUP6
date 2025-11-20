const { pool } = require('./db_config');

async function resolveDepartmentId(departmentId) {
  if (departmentId === undefined || departmentId === null) return null;
  let raw = departmentId;
  if (typeof raw === 'string') raw = raw.trim();
  if (raw === '' || String(raw).toUpperCase() === 'ALL') return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) return null;
  const [rows] = await pool.query('SELECT id FROM college_department WHERE id = ?', [parsed]);
  return rows.length > 0 ? parsed : null;
}

function sanitizeRichHtml(html) {
  if (html == null) return null;
  let safe = String(html);
  safe = safe.replace(/<!--[\s\S]*?-->/g, '');
  safe = safe.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  safe = safe.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  safe = safe.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, '');
  safe = safe.replace(/<a\b([^>]*)>/gi, (m, attrs) => {
    const hrefMatch = attrs.match(/href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
    let href = hrefMatch ? hrefMatch[1] : '';
    if (href.startsWith('"') || href.startsWith("'")) href = href.slice(1, -1);
    if (!/^https?:\/\//i.test(href)) {
      href = '';
    }
    const hrefAttr = href ? ` href="${href}"` : '';
    return `<a${hrefAttr} target="_blank" rel="noopener noreferrer">`;
  });
  safe = safe.replace(/<\/?(?!b|strong|i|em|u|p|br|ul|ol|li|a|div|span\b)[a-z0-9-]+[^>]*>/gi, '');
  return safe;
}

async function addTrainingProgram({ 
  employee_id, 
  program_name, 
  date, 
  time, 
  venue, 
  mode, 
  instructor, 
  description, 
  upload_photo, 
  max_participants, 
  register_link,
  department_id 
}) {
  try {
    const [userRows] = await pool.query(
      'SELECT id FROM users WHERE employee_id = ?', 
      [employee_id]
    );
    
    if (userRows.length === 0) {
      throw new Error('User not found');
    }
    
    const userId = userRows[0].id;
    
  const finalUploadPhoto = upload_photo ? upload_photo : null;

    const safeDescription = sanitizeRichHtml(description);
    const normalizedDepartmentId = await resolveDepartmentId(department_id);
    const [result] = await pool.query(
      `INSERT INTO training_program 
       (employee_id, department_id, program_name, date, time, venue, mode, instructor, description, upload_photo, max_participants, register_link) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, normalizedDepartmentId, program_name, date, time, venue, mode, instructor, safeDescription, finalUploadPhoto, max_participants, register_link ? 1 : 0]
    );
    
    return {
      success: true,
      training_id: result.insertId,
      message: 'Training program added successfully'
    };
  } catch (error) {
    console.error('Error adding training program:', error);
    throw error;
  }
}

async function getTrainingPrograms() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        tp.*,
        u.first_name,
        u.last_name,
        u.employee_id as creator_employee_id,
        COALESCE(cd.department, 'All Departments') as department
      FROM training_program tp
      JOIN users u ON tp.employee_id = u.id
      LEFT JOIN college_department cd ON tp.department_id = cd.id
      ORDER BY tp.created_at DESC
    `);
    const normalized = rows.map(r => {
      const copy = { ...r };
      const d = copy.date;
      if (d instanceof Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        copy.date = `${y}-${m}-${day}`;
      } else if (typeof d === 'string') {
        copy.date = d.split('T')[0];
      }
      return copy;
    });
    return normalized;
  } catch (error) {
    console.error('Error fetching training programs:', error);
    throw error;
  }
}

async function deleteTrainingProgram(trainingId, employeeId) {
  try {
    const [trainingRows] = await pool.query(
      'SELECT tp.*, u.employee_id FROM training_program tp JOIN users u ON tp.employee_id = u.id WHERE tp.id = ?',
      [trainingId]
    );
    
    if (trainingRows.length === 0) {
      throw new Error('Training program not found');
    }
    
    const [userRows] = await pool.query(
      'SELECT position, employee_id FROM users WHERE employee_id = ?',
      [employeeId]
    );
    
    if (userRows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userRows[0];
    const training = trainingRows[0];
    
    if (user.position !== 'admin' && user.employee_id !== training.employee_id) {
      throw new Error('Unauthorized: You can only delete your own training programs');
    }
    
    const [result] = await pool.query(
      'DELETE FROM training_program WHERE id = ?',
      [trainingId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Failed to delete training program');
    }
    
    return {
      success: true,
      message: 'Training program deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting training program:', error);
    throw error;
  }
}

async function updateTrainingProgram(trainingId, {
  program_name,
  date,
  time,
  venue,
  mode,
  instructor,
  description,
  upload_photo,
  max_participants,
  register_link,
  remove_photo,
  department_id
}) {
  try {
    const [trainingRows] = await pool.query('SELECT * FROM training_program WHERE id = ?', [trainingId]);
    if (trainingRows.length === 0) {
      throw new Error('Training program not found');
    }

    const fields = [];
    const values = [];

    if (program_name !== undefined) { fields.push('program_name = ?'); values.push(program_name); }
    if (date !== undefined) { fields.push('date = ?'); values.push(date); }
    if (time !== undefined) { fields.push('time = ?'); values.push(time); }
    if (venue !== undefined) { fields.push('venue = ?'); values.push(venue); }
    if (mode !== undefined) { fields.push('mode = ?'); values.push(mode); }
    if (instructor !== undefined) { fields.push('instructor = ?'); values.push(instructor); }
    if (description !== undefined) { fields.push('description = ?'); values.push(sanitizeRichHtml(description)); }
    if (remove_photo === true) {
      fields.push('upload_photo = ?'); values.push(null);
    } else if (upload_photo !== undefined) {
      fields.push('upload_photo = ?'); values.push(upload_photo);
    }
    if (max_participants !== undefined) { fields.push('max_participants = ?'); values.push(max_participants); }
    if (register_link !== undefined) { fields.push('register_link = ?'); values.push(register_link ? 1 : 0); }
    if (department_id !== undefined) {
      const normalizedDepartmentId = await resolveDepartmentId(department_id);
      fields.push('department_id = ?');
      values.push(normalizedDepartmentId);
    }

    if (fields.length === 0) {
      return { success: true, message: 'No changes' };
    }

    const sql = `UPDATE training_program SET ${fields.join(', ')} WHERE id = ?`;
    values.push(trainingId);

    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) throw new Error('Failed to update training program');

    return { success: true, message: 'Training program updated successfully' };
  } catch (error) {
    console.error('Error updating training program:', error);
    throw error;
  }
}

module.exports = {
  addTrainingProgram,
  getTrainingPrograms,
  deleteTrainingProgram,
  updateTrainingProgram
};
