/* Gabriel */
const APP = Object.freeze({
  NAME: 'Sistema de Gestión y Seguimiento Académico',
  SPREADSHEET_ID: '1s03NT6DkYcQ5v4t5oqPTGi1LYSuJK1Y2pkEF5TlGFMU',
  TZ: 'America/Lima',
  VERSION: '3.0.0',
  SHEETS: {
    CONFIG: 'DB_Config',
    USERS: 'DB_Usuarios',
    ENROLLMENT: 'DB_Matricula',
    COURSES: 'DB_Cursos',
    SESSIONS: 'DB_Horarios',
    PROJECTS: 'DB_Proyectos',
    MEMBERS: 'DB_Integrantes_Proyecto',
    ACTIONS: 'DB_Acciones',
    DAILY: 'DB_Reportes_Diarios',
    ATTENDANCE: 'DB_Asistencia',
    ACTIVITIES: 'DB_Actividades',
    WEEKS: 'DB_Semanas',
    WEEK_PLAN: 'DB_Plan_Semanal',
    REVIEWS: 'DB_Revisiones',
    MESSAGES: 'DB_Mensajes',
    AUDIT: 'DB_Auditoria'
  }
});

const SCHEMA = Object.freeze({
  DB_Config: ['CLAVE','VALOR','DESCRIPCION'],
  DB_Usuarios: ['ID','EMAIL','NOMBRE','ROL','ACTIVO','CREADO_EN','ACTUALIZADO_EN'],
  DB_Matricula: ['ID','PERIODO','ESTUDIANTE','CARRERA','CAMPUS','CICLO','APERTURA_MATRICULA','LIMITE_MATRICULA','FECHA_MATRICULA','INICIO_CLASES','TERMINO_MATRICULA','ESTADO_PAGO','EVIDENCIA_URL','ACTUALIZADO_POR','ACTUALIZADO_EN'],
  DB_Cursos: ['ID','PERIODO','NOMBRE','CODIGO','SITUACION','MODALIDAD','CREDITOS','ESTADO','OBSERVACIONES','ACTIVO','CREADO_POR','CREADO_EN','ACTUALIZADO_EN'],
  DB_Horarios: ['ID','CURSO_ID','DIA','HORA_INICIO','HORA_FIN','MODALIDAD','AULA_ENLACE','ACTIVO','CREADO_EN','ACTUALIZADO_EN'],
  DB_Proyectos: ['ID','CURSO_ID','TIPO','TITULO','DESCRIPCION','ALCANCE','INTEGRANTES','TELEFONOS','FECHA_LIMITE','ESTADO','EVIDENCIA_URL','NOTA','PROXIMO_PASO','ACTIVO','CREADO_POR','CREADO_EN','ACTUALIZADO_EN','FECHA_ENTREGA','NOTA_MAXIMA','OBSERVACION_DOCENTE'],
  DB_Integrantes_Proyecto: ['ID','PROYECTO_ID','NOMBRE','TELEFONO','ACTIVO','CREADO_EN','ACTUALIZADO_EN'],
  DB_Acciones: ['ID','PROYECTO_ID','ETAPA','TITULO','FECHA_LIMITE','ESTADO','AVANCE','EVIDENCIA_URL','ACTIVO','CREADO_EN','ACTUALIZADO_EN'],
  DB_Reportes_Diarios: ['ID','FECHA','PROYECTO_ID','ACCION_ID','HORAS','ACTIVIDAD_REALIZADA','AVANCE_ANTES','AVANCE_DESPUES','PROXIMO_PASO','EVIDENCIA_URL','OBSERVACION','REPORTADO_POR','CREADO_EN','ACTUALIZADO_EN'],
  DB_Asistencia: ['ID','FECHA','SESION_ID','CURSO_ID','ESTADO','JUSTIFICACION','TEMA_CLASE','COMPROMISOS','ACTUALIZADO_POR','ACTUALIZADO_EN'],
  DB_Actividades: ['ID','CURSO_ID','TIPO','TITULO','DESCRIPCION','FECHA_ASIGNADA','FECHA_LIMITE','PRIORIDAD','EVIDENCIA_REQUERIDA','ESTADO','RESULTADO_NOTA','EVIDENCIA_URL','CREADO_POR','CREADO_EN','ACTUALIZADO_EN'],
  DB_Semanas: ['ID','FECHA_INICIO','FECHA_FIN','ESTADO','DECLARA_SIN_ACTIVIDADES','CHECK_BLACKBOARD','CHECK_CURSOS','CHECK_CALENDARIO','ENVIADO_EN','APROBADO_EN','CERRADO_EN','OBSERVACION','CREADO_EN','ACTUALIZADO_EN'],
  DB_Plan_Semanal: ['ID','SEMANA_ID','ACTIVIDAD_ID','CURSO_ID','TIPO','TITULO','FECHA_OBJETIVO','HORA_BLOQUE','RESULTADO_ESPERADO','EVIDENCIA_ESPERADA','ESTADO_EJECUCION','EVIDENCIA_URL','OMITIDA','CREADO_EN','ACTUALIZADO_EN'],
  DB_Revisiones: ['ID','SEMANA_ID','ETAPA','DECISION','OBSERVACION','REVISADO_POR','REVISADO_EN'],
  DB_Mensajes: ['ID','DESTINATARIO','DISPARADOR','TITULO','MENSAJE','TIPO','EMISOR','REGLA_USO','ACTIVO'],
  DB_Auditoria: ['ID','FECHA_HORA','USUARIO','ROL','ACCION','ENTIDAD','ENTIDAD_ID','DETALLE_JSON']
});

let REQUEST_USER_ = null;

function doGet() {
  setupDatabase_();
  seedDefaults_();
  seedFamilyPins_();
  seedMasterMessages_();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP.NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}

function setupApp() {
  setupDatabase_();
  seedDefaults_();
  seedFamilyPins_();
  seedMasterMessages_();
  return {ok:true,message:'Sistema configurado correctamente.'};
}

function loginFamily(role, pin) {
  seedFamilyPins_();
  role = clean_(role).toUpperCase();
  const stored = PropertiesService.getScriptProperties().getProperty('PIN_' + role);
  if (!stored || stored !== hashPin_(pin)) throw new Error('El PIN no es correcto.');
  const user = readObjects_(APP.SHEETS.USERS).find(u => u.ROL === role && truthy_(u.ACTIVO));
  if (!user) throw new Error('El perfil no está habilitado.');
  const token = Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('AUTH_' + token, JSON.stringify(user), 21600);
  return {token, user:{NOMBRE:user.NOMBRE,ROL:user.ROL}};
}

function logoutFamily(token) {
  if (token) CacheService.getScriptCache().remove('AUTH_' + token);
  return true;
}

function callApi(token, action, args) {
  const handlers = {
    getBootstrap, saveConfig, saveEnrollment, saveCourse, deactivateCourse,
    saveSession, deactivateSession, saveProject, deactivateProject,
    saveAction, saveDailyReport, saveAttendance,
    saveActivity, deactivateActivity, prepareCurrentWeek, saveWeekPlanItem, submitWeek, reviewWeek, reviewPlanItem, closeWeek, reopenWeek,
    setDemoRole
  };
  if (!handlers[action]) throw new Error('Acción no permitida.');
  const raw = CacheService.getScriptCache().get('AUTH_' + clean_(token));
  if (!raw) throw new Error('SESSION_EXPIRED');
  REQUEST_USER_ = JSON.parse(raw);
  return handlers[action].apply(null, Array.isArray(args) ? args : []);
}

function getBootstrap() {
  setupDatabase_();
  seedDefaults_();

  const config = getConfigMap_();
  const user = currentUser_();
  const enrollment = getEnrollment_();
  const courses = readObjects_(APP.SHEETS.COURSES).filter(r => truthy_(r.ACTIVO));
  const sessions = readObjects_(APP.SHEETS.SESSIONS).filter(r => truthy_(r.ACTIVO));
  const rawProjects = readObjects_(APP.SHEETS.PROJECTS).filter(r => truthy_(r.ACTIVO));
  const members = readObjects_(APP.SHEETS.MEMBERS).filter(r => truthy_(r.ACTIVO));
  const actions = readObjects_(APP.SHEETS.ACTIONS).filter(r => truthy_(r.ACTIVO));
  const dailyReports = readObjects_(APP.SHEETS.DAILY);
  const attendance = readObjects_(APP.SHEETS.ATTENDANCE);
  const activities = readObjects_(APP.SHEETS.ACTIVITIES).filter(r => (!r.ACTIVO || truthy_(r.ACTIVO)) && r.ESTADO !== 'Retirada');
  const weeks = readObjects_(APP.SHEETS.WEEKS);
  const weekPlan = readObjects_(APP.SHEETS.WEEK_PLAN);
  const reviews = readObjects_(APP.SHEETS.REVIEWS);
  const messages = readObjects_(APP.SHEETS.MESSAGES).filter(r => !r.ACTIVO || truthy_(r.ACTIVO));

  const projects = rawProjects.map(p => Object.assign(enrichProject_(p, actions), {
    MEMBERS: members.filter(m => m.PROYECTO_ID === p.ID)
  }));
  const pendingItems = buildPendingItems_(projects, actions);
  const weekClasses = buildWeekClasses_(sessions, attendance);
  const dashboard = buildDashboard_(config, enrollment, courses, sessions, projects, actions, dailyReports, attendance, pendingItems, weekClasses);
  const currentWeek = getCurrentWeekSnapshot_(weeks, weekPlan, reviews, activities, sessions, attendance);
  const masterIndicators = buildMasterIndicators_(courses, sessions, activities, weeks, weekPlan, reviews, attendance, projects);
  const currentMessage = selectContextMessage_(user, masterIndicators, currentWeek, messages, dashboard);

  return {
    app:{name:APP.NAME,version:APP.VERSION,website:config.WEBSITE || 'www.superaloya.com'},
    config,
    user,
    enrollment,
    courses,
    sessions,
    projects,
    members,
    actions,
    dailyReports,
    attendance,
    activities,
    weeks,
    weekPlan,
    reviews,
    messages,
    currentWeek,
    masterIndicators,
    currentMessage,
    weekClasses,
    pendingItems,
    dashboard,
    permissions: permissionsFor_(user.ROL)
  };
}

function saveConfig(payload) {
  const user = requireRole_(['ADMIN']);
  const allowed = ['ESTUDIANTE','CARRERA','CAMPUS','PERIODO','WEBSITE'];
  allowed.forEach(key => {
    if (payload[key] == null) return;
    upsertConfig_(key, payload[key], 'Configuración general');
  });
  audit_(user,'GUARDAR','CONFIG','GENERAL',payload);
  return getBootstrap();
}

function saveEnrollment(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  const profile = getStudentProfile_();
  const record = {
    ID: payload.ID || 'MAT-' + Utilities.getUuid(),
    PERIODO: payload.PERIODO || (getConfigMap_().PERIODO || '2026-2'),
    ESTUDIANTE: profile.ESTUDIANTE,
    CARRERA: profile.CARRERA,
    CAMPUS: profile.CAMPUS,
    CICLO: clean_(payload.CICLO),
    APERTURA_MATRICULA: clean_(payload.APERTURA_MATRICULA),
    LIMITE_MATRICULA: clean_(payload.LIMITE_MATRICULA),
    FECHA_MATRICULA: clean_(payload.FECHA_MATRICULA),
    INICIO_CLASES: clean_(payload.INICIO_CLASES),
    TERMINO_MATRICULA: clean_(payload.TERMINO_MATRICULA),
    ESTADO_PAGO: payload.ESTADO_PAGO || 'Pendiente',
    EVIDENCIA_URL: clean_(payload.EVIDENCIA_URL),
    ACTUALIZADO_POR: user.NOMBRE,
    ACTUALIZADO_EN: now_()
  };
  upsert_(APP.SHEETS.ENROLLMENT, record, 'ID');
  audit_(user,'GUARDAR','MATRICULA',record.ID,record);
  return getBootstrap();
}

function saveCourse(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  if (!clean_(payload.NOMBRE)) throw new Error('El nombre del curso es obligatorio.');
  const existing = payload.ID ? findById_(APP.SHEETS.COURSES,payload.ID) : null;
  const others = readObjects_(APP.SHEETS.COURSES).filter(r => truthy_(r.ACTIVO) && r.ID !== payload.ID);
  if (others.some(r => clean_(r.NOMBRE).toLowerCase() === clean_(payload.NOMBRE).toLowerCase())) throw new Error('Ya existe un curso activo con ese nombre.');
  const now = now_();
  const record = {
    ID: payload.ID || 'CUR-' + Utilities.getUuid(),
    PERIODO: getConfigMap_().PERIODO || '2026-2',
    NOMBRE: clean_(payload.NOMBRE),
    CODIGO: clean_(payload.CODIGO),
    SITUACION: payload.SITUACION || '1.ª vez',
    MODALIDAD: payload.MODALIDAD || 'Presencial',
    CREDITOS: number_(payload.CREDITOS),
    ESTADO: payload.ESTADO || 'Matriculado',
    OBSERVACIONES: clean_(payload.OBSERVACIONES),
    ACTIVO: true,
    CREADO_POR: existing ? existing.CREADO_POR : user.NOMBRE,
    CREADO_EN: existing ? existing.CREADO_EN : now,
    ACTUALIZADO_EN: now
  };
  upsert_(APP.SHEETS.COURSES, record, 'ID');
  audit_(user, existing ? 'EDITAR' : 'CREAR', 'CURSO', record.ID, record);
  return getBootstrap();
}

function deactivateCourse(id) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  const item = findById_(APP.SHEETS.COURSES,id);
  if (!item) throw new Error('Curso no encontrado.');

  const now = now_();
  item.ACTIVO = false;
  item.ACTUALIZADO_EN = now;
  upsert_(APP.SHEETS.COURSES,item,'ID');

  // Al retirar un curso, también se desactivan sus horarios.
  // Se conserva el historial, pero dejan de participar en calendario y cruces.
  const linkedSessions = readObjects_(APP.SHEETS.SESSIONS)
    .filter(s => truthy_(s.ACTIVO) && s.CURSO_ID === id);

  linkedSessions.forEach(s => {
    s.ACTIVO = false;
    s.ACTUALIZADO_EN = now;
    upsert_(APP.SHEETS.SESSIONS,s,'ID');
  });

  audit_(user,'DESACTIVAR','CURSO',id,{
    curso:item,
    horariosDesactivados:linkedSessions.map(s => s.ID)
  });

  return getBootstrap();
}

function saveSession(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  if (!payload.CURSO_ID || !payload.DIA || !payload.HORA_INICIO || !payload.HORA_FIN) throw new Error('Curso, día, hora de inicio y hora de fin son obligatorios.');
  if (payload.HORA_INICIO >= payload.HORA_FIN) throw new Error('La hora final debe ser posterior a la hora inicial.');

  const course = findById_(APP.SHEETS.COURSES,payload.CURSO_ID);
  if (!course || !truthy_(course.ACTIVO)) throw new Error('El curso seleccionado ya no está activo.');

  const existing = payload.ID ? findById_(APP.SHEETS.SESSIONS,payload.ID) : null;

  // Solo los horarios activos de cursos activos pueden generar un cruce.
  const activeCourseIds = new Set(
    readObjects_(APP.SHEETS.COURSES)
      .filter(c => truthy_(c.ACTIVO))
      .map(c => c.ID)
  );

  const others = readObjects_(APP.SHEETS.SESSIONS)
    .filter(r =>
      truthy_(r.ACTIVO) &&
      r.ID !== payload.ID &&
      activeCourseIds.has(r.CURSO_ID)
    );

  const conflict = others.find(s =>
    s.DIA === payload.DIA &&
    payload.HORA_INICIO < s.HORA_FIN &&
    payload.HORA_FIN > s.HORA_INICIO
  );

  if (conflict) {
    const conflictCourse = findById_(APP.SHEETS.COURSES, conflict.CURSO_ID);
    const conflictName = conflictCourse ? conflictCourse.NOMBRE : 'otra clase';
    throw new Error(
      'Existe un cruce el ' + payload.DIA + ' con ' +
      conflictName + ' (' + conflict.HORA_INICIO + '–' + conflict.HORA_FIN + ').'
    );
  }

  const now = now_();
  const record = {
    ID: payload.ID || 'HOR-' + Utilities.getUuid(),
    CURSO_ID: payload.CURSO_ID,
    DIA: payload.DIA,
    HORA_INICIO: payload.HORA_INICIO,
    HORA_FIN: payload.HORA_FIN,
    MODALIDAD: payload.MODALIDAD || 'Presencial',
    AULA_ENLACE: clean_(payload.AULA_ENLACE),
    ACTIVO: true,
    CREADO_EN: existing ? existing.CREADO_EN : now,
    ACTUALIZADO_EN: now
  };
  upsert_(APP.SHEETS.SESSIONS,record,'ID');
  audit_(user, existing ? 'EDITAR' : 'CREAR', 'HORARIO', record.ID, record);
  return getBootstrap();
}

function deactivateSession(id) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  const item = findById_(APP.SHEETS.SESSIONS,id);
  if (!item) throw new Error('Horario no encontrado.');
  item.ACTIVO = false;
  item.ACTUALIZADO_EN = now_();
  upsert_(APP.SHEETS.SESSIONS,item,'ID');
  audit_(user,'DESACTIVAR','HORARIO',id,item);
  return getBootstrap();
}

function saveProject(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  if (!payload.CURSO_ID || !clean_(payload.TITULO) || !payload.FECHA_LIMITE) {
    throw new Error('Curso, nombre del proyecto y fecha límite son obligatorios.');
  }
  const allowedStates = ['No iniciado','Iniciado','En proceso','Entregado','Calificado','Cerrado'];
  const existing = payload.ID ? findById_(APP.SHEETS.PROJECTS,payload.ID) : null;
  const now = now_();
  let status = allowedStates.includes(payload.ESTADO) ? payload.ESTADO : 'No iniciado';
  if (clean_(payload.NOTA) && !['Calificado','Cerrado'].includes(status)) status = 'Calificado';
  if (clean_(payload.FECHA_ENTREGA) && ['No iniciado','Iniciado','En proceso'].includes(status)) status = 'Entregado';

  let members = [];
  try { members = JSON.parse(payload.INTEGRANTES_JSON || '[]'); } catch (e) { members = []; }
  members = members
    .map(m => ({NOMBRE:clean_(m.NOMBRE), TELEFONO:clean_(m.TELEFONO)}))
    .filter(m => m.NOMBRE || m.TELEFONO);
  if ((payload.ALCANCE || 'Individual') === 'Individual') members = [];

  const record = {
    ID: payload.ID || 'PROY-' + Utilities.getUuid(),
    CURSO_ID: payload.CURSO_ID,
    TIPO: payload.TIPO || 'Tarea',
    TITULO: clean_(payload.TITULO),
    DESCRIPCION: clean_(payload.DESCRIPCION),
    ALCANCE: payload.ALCANCE || 'Individual',
    INTEGRANTES: members.map(m => m.NOMBRE).join(' | '),
    TELEFONOS: members.map(m => m.TELEFONO).join(' | '),
    FECHA_LIMITE: payload.FECHA_LIMITE,
    ESTADO: status,
    EVIDENCIA_URL: clean_(payload.EVIDENCIA_URL),
    NOTA: clean_(payload.NOTA),
    PROXIMO_PASO: clean_(payload.PROXIMO_PASO),
    ACTIVO: true,
    CREADO_POR: existing ? existing.CREADO_POR : user.NOMBRE,
    CREADO_EN: existing ? existing.CREADO_EN : now,
    ACTUALIZADO_EN: now,
    FECHA_ENTREGA: clean_(payload.FECHA_ENTREGA),
    NOTA_MAXIMA: clean_(payload.NOTA_MAXIMA),
    OBSERVACION_DOCENTE: clean_(payload.OBSERVACION_DOCENTE)
  };
  upsert_(APP.SHEETS.PROJECTS,record,'ID');
  replaceProjectMembers_(record.ID, members);
  audit_(user, existing ? 'EDITAR' : 'CREAR', 'PROYECTO', record.ID, record);
  return getBootstrap();
}

function replaceProjectMembers_(projectId, members) {
  const existing = readObjects_(APP.SHEETS.MEMBERS).filter(m => m.PROYECTO_ID === projectId && truthy_(m.ACTIVO));
  existing.forEach(m => {
    m.ACTIVO = false;
    m.ACTUALIZADO_EN = now_();
    upsert_(APP.SHEETS.MEMBERS,m,'ID');
  });
  members.forEach(m => appendObject_(APP.SHEETS.MEMBERS, {
    ID:'INT-' + Utilities.getUuid(), PROYECTO_ID:projectId, NOMBRE:m.NOMBRE, TELEFONO:m.TELEFONO,
    ACTIVO:true, CREADO_EN:now_(), ACTUALIZADO_EN:now_()
  }));
}

function deactivateProject(id) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  const item = findById_(APP.SHEETS.PROJECTS,id);
  if (!item) throw new Error('Proyecto no encontrado.');
  item.ACTIVO = false;
  item.ACTUALIZADO_EN = now_();
  upsert_(APP.SHEETS.PROJECTS,item,'ID');
  audit_(user,'DESACTIVAR','PROYECTO',id,item);
  return getBootstrap();
}

function saveAction(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  if (!payload.PROYECTO_ID || !clean_(payload.TITULO) || !payload.FECHA_LIMITE) throw new Error('Proyecto, acción y fecha límite son obligatorios.');
  const existing = payload.ID ? findById_(APP.SHEETS.ACTIONS,payload.ID) : null;
  const now = now_();
  const avance = clamp_(number_(payload.AVANCE),0,100);
  const estado = payload.ESTADO || (avance >= 100 ? 'Completada' : 'Pendiente');
  const record = {
    ID: payload.ID || 'ACC-' + Utilities.getUuid(),
    PROYECTO_ID: payload.PROYECTO_ID,
    ETAPA: payload.ETAPA || 'Ejecución',
    TITULO: clean_(payload.TITULO),
    FECHA_LIMITE: payload.FECHA_LIMITE,
    ESTADO: estado,
    AVANCE: avance,
    EVIDENCIA_URL: clean_(payload.EVIDENCIA_URL),
    ACTIVO: true,
    CREADO_EN: existing ? existing.CREADO_EN : now,
    ACTUALIZADO_EN: now
  };
  upsert_(APP.SHEETS.ACTIONS,record,'ID');
  audit_(user, existing ? 'EDITAR' : 'CREAR', 'ACCION', record.ID, record);
  return getBootstrap();
}

function saveDailyReport(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  if (!payload.FECHA || !clean_(payload.ACTIVIDAD_REALIZADA)) throw new Error('Fecha y actividad realizada son obligatorias.');
  const existing = payload.ID ? findById_(APP.SHEETS.DAILY,payload.ID) : null;
  const now = now_();
  const before = clamp_(number_(payload.AVANCE_ANTES),0,100);
  const after = clamp_(number_(payload.AVANCE_DESPUES),0,100);
  const record = {
    ID: payload.ID || 'REP-' + Utilities.getUuid(),
    FECHA: payload.FECHA,
    PROYECTO_ID: clean_(payload.PROYECTO_ID),
    ACCION_ID: clean_(payload.ACCION_ID),
    HORAS: number_(payload.HORAS),
    ACTIVIDAD_REALIZADA: clean_(payload.ACTIVIDAD_REALIZADA),
    AVANCE_ANTES: before,
    AVANCE_DESPUES: after,
    PROXIMO_PASO: clean_(payload.PROXIMO_PASO),
    EVIDENCIA_URL: clean_(payload.EVIDENCIA_URL),
    OBSERVACION: clean_(payload.OBSERVACION),
    REPORTADO_POR: user.NOMBRE,
    CREADO_EN: existing ? existing.CREADO_EN : now,
    ACTUALIZADO_EN: now
  };
  upsert_(APP.SHEETS.DAILY,record,'ID');
  if (record.ACCION_ID) {
    const action = findById_(APP.SHEETS.ACTIONS,record.ACCION_ID);
    if (action) {
      action.AVANCE = after;
      action.ESTADO = after >= 100 ? 'Completada' : (after > 0 ? 'En proceso' : (action.ESTADO || 'Pendiente'));
      action.ACTUALIZADO_EN = now_();
      upsert_(APP.SHEETS.ACTIONS,action,'ID');
      const project = findById_(APP.SHEETS.PROJECTS, action.PROYECTO_ID);
      if (project && project.ESTADO === 'No iniciado') {
        project.ESTADO = after > 0 ? 'En proceso' : 'Iniciado';
        project.ACTUALIZADO_EN = now_();
        upsert_(APP.SHEETS.PROJECTS,project,'ID');
      }
    }
  }
  audit_(user, existing ? 'EDITAR' : 'CREAR', 'REPORTE_DIARIO', record.ID, record);
  return getBootstrap();
}

function saveAttendance(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  if (!payload.FECHA || !payload.CURSO_ID || !payload.ESTADO) throw new Error('Fecha, curso y estado son obligatorios.');
  const existing = payload.ID ? findById_(APP.SHEETS.ATTENDANCE,payload.ID) : null;
  const record = {
    ID: payload.ID || 'ASI-' + Utilities.getUuid(),
    FECHA: payload.FECHA,
    SESION_ID: clean_(payload.SESION_ID),
    CURSO_ID: payload.CURSO_ID,
    ESTADO: payload.ESTADO,
    JUSTIFICACION: clean_(payload.JUSTIFICACION),
    TEMA_CLASE: clean_(payload.TEMA_CLASE),
    COMPROMISOS: clean_(payload.COMPROMISOS),
    ACTUALIZADO_POR: user.NOMBRE,
    ACTUALIZADO_EN: now_()
  };
  upsert_(APP.SHEETS.ATTENDANCE, record, 'ID');
  audit_(user, existing ? 'EDITAR' : 'CREAR', 'ASISTENCIA', record.ID, record);
  return getBootstrap();
}


/* =========================================================
   AGENDA ACADÉMICA + SEMANA + SUPERVISIÓN
   ========================================================= */
function saveActivity(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  if (!payload.CURSO_ID || !clean_(payload.TITULO) || !payload.FECHA_LIMITE) {
    throw new Error('Curso, actividad y fecha límite son obligatorios.');
  }
  const existing = payload.ID ? findById_(APP.SHEETS.ACTIVITIES,payload.ID) : null;
  const now = now_();
  const record = {
    ID: payload.ID || 'ACT-' + Utilities.getUuid(),
    CURSO_ID: payload.CURSO_ID,
    TIPO: payload.TIPO || 'Tarea',
    TITULO: clean_(payload.TITULO),
    DESCRIPCION: clean_(payload.DESCRIPCION),
    FECHA_ASIGNADA: clean_(payload.FECHA_ASIGNADA) || dateOnly_(new Date()),
    FECHA_LIMITE: payload.FECHA_LIMITE,
    PRIORIDAD: payload.PRIORIDAD || 'Media',
    EVIDENCIA_REQUERIDA: clean_(payload.EVIDENCIA_REQUERIDA),
    ESTADO: payload.ESTADO || 'Abierta',
    RESULTADO_NOTA: clean_(payload.RESULTADO_NOTA),
    EVIDENCIA_URL: clean_(payload.EVIDENCIA_URL),
    CREADO_POR: existing ? existing.CREADO_POR : user.NOMBRE,
    CREADO_EN: existing ? existing.CREADO_EN : now,
    ACTUALIZADO_EN: now
  };
  upsert_(APP.SHEETS.ACTIVITIES,record,'ID');
  audit_(user,existing?'EDITAR':'CREAR','ACTIVIDAD',record.ID,record);
  return getBootstrap();
}

function deactivateActivity(id) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  const item = findById_(APP.SHEETS.ACTIVITIES,id);
  if (!item) throw new Error('Actividad no encontrada.');
  item.ESTADO = 'Retirada';
  item.ACTUALIZADO_EN = now_();
  upsert_(APP.SHEETS.ACTIVITIES,item,'ID');
  audit_(user,'RETIRAR','ACTIVIDAD',id,item);
  return getBootstrap();
}

function prepareCurrentWeek() {
  const user = requireRole_(['GABRIEL','ADMIN']);
  const bounds = weekBounds_(new Date());
  let week = readObjects_(APP.SHEETS.WEEKS).find(w => w.FECHA_INICIO === bounds.start);
  const now = now_();
  if (!week) {
    week = {
      ID:'SEM-' + bounds.start,
      FECHA_INICIO:bounds.start,
      FECHA_FIN:bounds.end,
      ESTADO:'BORRADOR',
      DECLARA_SIN_ACTIVIDADES:false,
      CHECK_BLACKBOARD:false,
      CHECK_CURSOS:false,
      CHECK_CALENDARIO:false,
      ENVIADO_EN:'', APROBADO_EN:'', CERRADO_EN:'', OBSERVACION:'',
      CREADO_EN:now, ACTUALIZADO_EN:now
    };
    appendObject_(APP.SHEETS.WEEKS,week);
  }
  if (['APROBADA','CERRADA'].includes(week.ESTADO)) return getBootstrap();

  const existing = readObjects_(APP.SHEETS.WEEK_PLAN).filter(p => p.SEMANA_ID === week.ID);
  const existingActivityIds = new Set(existing.map(p => p.ACTIVIDAD_ID).filter(Boolean));
  const activities = readObjects_(APP.SHEETS.ACTIVITIES).filter(a =>
    a.ESTADO !== 'Retirada' &&
    !['Completada','Entregada','Calificada','Cerrada'].includes(a.ESTADO) &&
    a.FECHA_LIMITE && a.FECHA_LIMITE <= bounds.end
  );
  activities.forEach(a => {
    if (existingActivityIds.has(a.ID)) return;
    appendObject_(APP.SHEETS.WEEK_PLAN,{
      ID:'PLAN-' + Utilities.getUuid(), SEMANA_ID:week.ID, ACTIVIDAD_ID:a.ID,
      CURSO_ID:a.CURSO_ID, TIPO:a.TIPO, TITULO:a.TITULO,
      FECHA_OBJETIVO:a.FECHA_LIMITE < bounds.start ? bounds.start : a.FECHA_LIMITE,
      HORA_BLOQUE:'', RESULTADO_ESPERADO:'', EVIDENCIA_ESPERADA:a.EVIDENCIA_REQUERIDA || '',
      ESTADO_EJECUCION:'Pendiente', EVIDENCIA_URL:'', OMITIDA:false,
      CREADO_EN:now, ACTUALIZADO_EN:now
    });
  });
  week.ACTUALIZADO_EN = now;
  upsert_(APP.SHEETS.WEEKS,week,'ID');
  audit_(user,'PREPARAR','SEMANA',week.ID,{actividadesDetectadas:activities.length});
  return getBootstrap();
}

function saveWeekPlanItem(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  const week = findById_(APP.SHEETS.WEEKS,payload.SEMANA_ID);
  if (!week) throw new Error('Semana no encontrada.');
  if (['APROBADA','CERRADA'].includes(week.ESTADO)) throw new Error('La semana está bloqueada. Debe reabrirse antes de editar.');
  if (!clean_(payload.TITULO) || !payload.FECHA_OBJETIVO) throw new Error('Actividad y fecha objetivo son obligatorias.');
  const existing = payload.ID ? findById_(APP.SHEETS.WEEK_PLAN,payload.ID) : null;
  const now = now_();
  const record = {
    ID: payload.ID || 'PLAN-' + Utilities.getUuid(), SEMANA_ID:week.ID,
    ACTIVIDAD_ID:clean_(payload.ACTIVIDAD_ID), CURSO_ID:clean_(payload.CURSO_ID),
    TIPO:payload.TIPO || 'Actividad', TITULO:clean_(payload.TITULO),
    FECHA_OBJETIVO:payload.FECHA_OBJETIVO, HORA_BLOQUE:clean_(payload.HORA_BLOQUE),
    RESULTADO_ESPERADO:clean_(payload.RESULTADO_ESPERADO), EVIDENCIA_ESPERADA:clean_(payload.EVIDENCIA_ESPERADA),
    ESTADO_EJECUCION:payload.ESTADO_EJECUCION || 'Pendiente', EVIDENCIA_URL:clean_(payload.EVIDENCIA_URL),
    OMITIDA:truthy_(payload.OMITIDA), CREADO_EN:existing?existing.CREADO_EN:now, ACTUALIZADO_EN:now
  };
  upsert_(APP.SHEETS.WEEK_PLAN,record,'ID');
  audit_(user,existing?'EDITAR':'CREAR','PLAN_SEMANAL',record.ID,record);
  return getBootstrap();
}

function submitWeek(payload) {
  const user = requireRole_(['GABRIEL','ADMIN']);
  const week = findById_(APP.SHEETS.WEEKS,payload.ID);
  if (!week) throw new Error('Semana no encontrada.');
  if (week.ESTADO === 'CERRADA') throw new Error('La semana ya está cerrada.');
  const plan = readObjects_(APP.SHEETS.WEEK_PLAN).filter(p => p.SEMANA_ID === week.ID);
  const declaresNone = truthy_(payload.DECLARA_SIN_ACTIVIDADES);
  const checks = ['CHECK_BLACKBOARD','CHECK_CURSOS','CHECK_CALENDARIO'];
  checks.forEach(k => week[k] = truthy_(payload[k]));
  week.DECLARA_SIN_ACTIVIDADES = declaresNone;
  week.OBSERVACION = clean_(payload.OBSERVACION);
  if (declaresNone) {
    if (!checks.every(k => truthy_(week[k]))) throw new Error('Para declarar una semana sin actividades debes confirmar Blackboard, cursos y calendario.');
    const openActivities = readObjects_(APP.SHEETS.ACTIVITIES).filter(a => a.ESTADO !== 'Retirada' && !['Completada','Entregada','Calificada','Cerrada'].includes(a.ESTADO) && a.FECHA_LIMITE && a.FECHA_LIMITE <= week.FECHA_FIN);
    if (openActivities.length || plan.length) throw new Error('El sistema detectó compromisos activos; no se puede declarar la semana vacía.');
  } else {
    if (!plan.length) throw new Error('La semana no tiene actividades planificadas. Prepárala antes de enviarla.');
    const incomplete = plan.filter(p => !p.FECHA_OBJETIVO || !clean_(p.RESULTADO_ESPERADO));
    if (incomplete.length) throw new Error('Faltan fecha objetivo o resultado esperado en ' + incomplete.length + ' actividad(es).');
  }
  week.ESTADO = 'ENVIADA';
  week.ENVIADO_EN = now_();
  week.ACTUALIZADO_EN = now_();
  upsert_(APP.SHEETS.WEEKS,week,'ID');
  audit_(user,'ENVIAR','SEMANA',week.ID,week);
  return getBootstrap();
}

function reviewWeek(payload) {
  const user = requireRole_(['GLORIA','ADMIN']);
  const week = findById_(APP.SHEETS.WEEKS,payload.SEMANA_ID);
  if (!week) throw new Error('Semana no encontrada.');
  if (week.ESTADO !== 'ENVIADA') throw new Error('Solo se puede revisar una semana enviada.');
  const decision = String(payload.DECISION || '').toUpperCase();
  if (!['APROBADA','DEVUELTA'].includes(decision)) throw new Error('Decisión no válida.');
  if (decision === 'DEVUELTA' && !clean_(payload.OBSERVACION)) throw new Error('La devolución requiere una observación.');
  appendObject_(APP.SHEETS.REVIEWS,{
    ID:'REV-' + Utilities.getUuid(), SEMANA_ID:week.ID, ETAPA:'PLANIFICACION', DECISION:decision,
    OBSERVACION:clean_(payload.OBSERVACION), REVISADO_POR:user.NOMBRE, REVISADO_EN:now_()
  });
  week.ESTADO = decision;
  week.OBSERVACION = clean_(payload.OBSERVACION);
  week.APROBADO_EN = decision === 'APROBADA' ? now_() : '';
  week.ACTUALIZADO_EN = now_();
  upsert_(APP.SHEETS.WEEKS,week,'ID');
  audit_(user,'REVISAR','SEMANA',week.ID,{decision,observacion:payload.OBSERVACION});
  return getBootstrap();
}


function reviewPlanItem(payload) {
  const user = requireRole_(['GLORIA','ADMIN']);
  const item = findById_(APP.SHEETS.WEEK_PLAN,payload.ID);
  if (!item) throw new Error('Compromiso semanal no encontrado.');
  const week = findById_(APP.SHEETS.WEEKS,item.SEMANA_ID);
  if (!week || !['APROBADA','ENVIADA'].includes(week.ESTADO)) throw new Error('La semana no está disponible para validación.');
  const decision = String(payload.DECISION || '').toUpperCase();
  if (!['VALIDADA','OBSERVADA'].includes(decision)) throw new Error('Decisión no válida.');
  if (decision === 'OBSERVADA' && !clean_(payload.OBSERVACION)) throw new Error('Debes indicar qué debe corregirse.');
  item.ESTADO_EJECUCION = decision === 'VALIDADA' ? 'Validada' : 'Observada';
  item.ACTUALIZADO_EN = now_();
  upsert_(APP.SHEETS.WEEK_PLAN,item,'ID');
  appendObject_(APP.SHEETS.REVIEWS,{
    ID:'REV-' + Utilities.getUuid(), SEMANA_ID:item.SEMANA_ID,
    ETAPA:'ACTIVIDAD:' + item.ID, DECISION:decision,
    OBSERVACION:clean_(payload.OBSERVACION), REVISADO_POR:user.NOMBRE, REVISADO_EN:now_()
  });
  audit_(user,'VALIDAR','PLAN_SEMANAL',item.ID,{decision,observacion:payload.OBSERVACION});
  return getBootstrap();
}

function closeWeek(payload) {
  const user = requireRole_(['GLORIA','ADMIN']);
  const week = findById_(APP.SHEETS.WEEKS,payload.SEMANA_ID || payload.ID);
  if (!week) throw new Error('Semana no encontrada.');
  if (week.ESTADO !== 'APROBADA') throw new Error('Solo puede cerrarse una semana aprobada.');
  const plan = readObjects_(APP.SHEETS.WEEK_PLAN).filter(p => p.SEMANA_ID === week.ID);
  const unfinished = plan.filter(p => !['Cumplida','Completada','Entregada','Validada'].includes(p.ESTADO_EJECUCION));
  if (unfinished.length) throw new Error('Quedan ' + unfinished.length + ' actividad(es) sin completar o validar.');
  const evidenceMissing = plan.filter(p => clean_(p.EVIDENCIA_ESPERADA) && !clean_(p.EVIDENCIA_URL));
  if (evidenceMissing.length) throw new Error('Falta evidencia realizada en ' + evidenceMissing.length + ' actividad(es) que la requieren.');
  const sessions = readObjects_(APP.SHEETS.SESSIONS).filter(s => truthy_(s.ACTIVO));
  const attendance = readObjects_(APP.SHEETS.ATTENDANCE);
  const days={'Lunes':0,'Martes':1,'Miércoles':2,'Jueves':3,'Viernes':4,'Sábado':5,'Domingo':6};
  const missing=[];
  sessions.forEach(s=>{
    const d=new Date(week.FECHA_INICIO+'T12:00:00'); d.setDate(d.getDate()+(days[s.DIA]||0));
    const date=dateOnly_(d);
    const mark=attendance.find(a => (a.SESION_ID===s.ID || a.CURSO_ID===s.CURSO_ID) && a.FECHA===date);
    if(!mark) missing.push(s.ID);
  });
  if (missing.length) throw new Error('Falta registrar asistencia en ' + missing.length + ' clase(s) de la semana.');
  appendObject_(APP.SHEETS.REVIEWS,{
    ID:'REV-' + Utilities.getUuid(), SEMANA_ID:week.ID, ETAPA:'CIERRE', DECISION:'CERRADA',
    OBSERVACION:clean_(payload.OBSERVACION), REVISADO_POR:user.NOMBRE, REVISADO_EN:now_()
  });
  week.ESTADO='CERRADA'; week.CERRADO_EN=now_(); week.OBSERVACION=clean_(payload.OBSERVACION); week.ACTUALIZADO_EN=now_();
  upsert_(APP.SHEETS.WEEKS,week,'ID');
  audit_(user,'CERRAR','SEMANA',week.ID,week);
  return getBootstrap();
}

function reopenWeek(payload) {
  const user = requireRole_(['GLORIA','ADMIN']);
  const week = findById_(APP.SHEETS.WEEKS,payload.SEMANA_ID || payload.ID);
  if (!week) throw new Error('Semana no encontrada.');
  if (!clean_(payload.OBSERVACION)) throw new Error('Debes indicar el motivo de reapertura.');
  appendObject_(APP.SHEETS.REVIEWS,{
    ID:'REV-' + Utilities.getUuid(), SEMANA_ID:week.ID, ETAPA:'REAPERTURA', DECISION:'REABIERTA',
    OBSERVACION:clean_(payload.OBSERVACION), REVISADO_POR:user.NOMBRE, REVISADO_EN:now_()
  });
  week.ESTADO='BORRADOR'; week.APROBADO_EN=''; week.CERRADO_EN=''; week.OBSERVACION=clean_(payload.OBSERVACION); week.ACTUALIZADO_EN=now_();
  upsert_(APP.SHEETS.WEEKS,week,'ID');
  audit_(user,'REABRIR','SEMANA',week.ID,{motivo:payload.OBSERVACION});
  return getBootstrap();
}

function getCurrentWeekSnapshot_(weeks, weekPlan, reviews, activities, sessions, attendance) {
  const bounds = weekBounds_(new Date());
  const week = weeks.find(w => w.FECHA_INICIO === bounds.start) || null;
  const plan = week ? weekPlan.filter(p => p.SEMANA_ID === week.ID) : [];
  const revs = week ? reviews.filter(r => r.SEMANA_ID === week.ID) : [];
  const detected = activities.filter(a => a.ESTADO !== 'Retirada' && !['Completada','Entregada','Calificada','Cerrada'].includes(a.ESTADO) && a.FECHA_LIMITE && a.FECHA_LIMITE <= bounds.end);
  const complete = plan.length ? plan.filter(p => ['Cumplida','Completada','Entregada','Validada'].includes(p.ESTADO_EJECUCION)).length : 0;
  const planActivityIds = new Set(plan.map(p=>p.ACTIVIDAD_ID).filter(Boolean));
  const sentDate = week && week.ENVIADO_EN ? String(week.ENVIADO_EN).slice(0,10) : '';
  const omissions = week ? detected.filter(a => !planActivityIds.has(a.ID) && sentDate && (!a.FECHA_ASIGNADA || a.FECHA_ASIGNADA <= sentDate)) : [];
  const evidenceRequired = plan.filter(p=>clean_(p.EVIDENCIA_ESPERADA)).length;
  const evidenceProvided = plan.filter(p=>clean_(p.EVIDENCIA_ESPERADA) && clean_(p.EVIDENCIA_URL)).length;
  return {
    bounds, week, plan, reviews:revs,
    detectedActivities:detected, omissions, omissionCount:omissions.length,
    planCount:plan.length,
    completedCount:complete,
    completionRate:plan.length ? Math.round(complete/plan.length*100) : 0,
    evidenceRequired, evidenceProvided, evidenceRate:evidenceRequired?Math.round(evidenceProvided/evidenceRequired*100):100,
    locked:!!week && ['APROBADA','CERRADA'].includes(week.ESTADO),
    canReview:!!week && week.ESTADO === 'ENVIADA',
    canClose:!!week && week.ESTADO === 'APROBADA'
  };
}


function buildMasterIndicators_(courses, sessions, activities, weeks, weekPlan, reviews, attendance, projects) {
  const today = dateOnly_(new Date());
  const bounds = weekBounds_(new Date());
  const current = weeks.find(w=>w.FECHA_INICIO===bounds.start) || null;
  const plan = current ? weekPlan.filter(p=>p.SEMANA_ID===current.ID) : [];
  const detected = activities.filter(a=>a.ESTADO!=='Retirada' && !['Completada','Entregada','Calificada','Cerrada'].includes(a.ESTADO) && a.FECHA_LIMITE && a.FECHA_LIMITE<=bounds.end);
  const planIds = new Set(plan.map(p=>p.ACTIVIDAD_ID).filter(Boolean));
  const sentDate = current && current.ENVIADO_EN ? String(current.ENVIADO_EN).slice(0,10) : '';
  const omissions = current ? detected.filter(a=>!planIds.has(a.ID) && sentDate && (!a.FECHA_ASIGNADA || a.FECHA_ASIGNADA<=sentDate)) : [];
  const coverage = detected.length ? Math.round((detected.filter(a=>planIds.has(a.ID)).length/detected.length)*100) : 100;
  const completed = plan.filter(p=>['Cumplida','Completada','Entregada','Validada'].includes(p.ESTADO_EJECUCION)).length;
  const compliance = plan.length ? Math.round(completed/plan.length*100) : (current&&current.ESTADO==='CERRADA'?100:0);
  const evidenceRequired=plan.filter(p=>clean_(p.EVIDENCIA_ESPERADA)).length;
  const evidenceValidated=plan.filter(p=>clean_(p.EVIDENCIA_ESPERADA)&&p.ESTADO_EJECUCION==='Validada').length;
  const evidenceRate=evidenceRequired?Math.round(evidenceValidated/evidenceRequired*100):100;
  const elapsedAttendance=attendance.filter(a=>a.FECHA && a.FECHA<=today);
  const attended=elapsedAttendance.filter(a=>['Asistió','Tardanza'].includes(a.ESTADO)).length;
  const attendanceRate=elapsedAttendance.length?Math.round(attended/elapsedAttendance.length*100):null;
  const delivered=activities.filter(a=>['Entregada','Completada','Calificada','Cerrada'].includes(a.ESTADO) && a.FECHA_LIMITE);
  const onTime=delivered.filter(a=>!a.ACTUALIZADO_EN || String(a.ACTUALIZADO_EN).slice(0,10)<=a.FECHA_LIMITE).length;
  const onTimeRate=delivered.length?Math.round(onTime/delivered.length*100):null;
  const closedWeeks=weeks.filter(w=>w.ESTADO==='CERRADA').sort((a,b)=>String(b.FECHA_INICIO).localeCompare(String(a.FECHA_INICIO)));
  let streak=0; for(const w of closedWeeks){ const wp=weekPlan.filter(p=>p.SEMANA_ID===w.ID); if(wp.length && wp.every(p=>['Cumplida','Completada','Entregada','Validada'].includes(p.ESTADO_EJECUCION))) streak++; else break; }
  const courseRisk=courses.map(c=>{
    const ca=activities.filter(a=>a.CURSO_ID===c.ID && a.ESTADO!=='Retirada');
    const overdue=ca.filter(a=>a.FECHA_LIMITE&&a.FECHA_LIMITE<today&&!['Completada','Entregada','Calificada','Cerrada'].includes(a.ESTADO)).length;
    const att=attendance.filter(a=>a.CURSO_ID===c.ID);
    const cAttended=att.filter(a=>['Asistió','Tardanza'].includes(a.ESTADO)).length;
    const cRate=att.length?Math.round(cAttended/att.length*100):null;
    const repeat=['2.ª vez','3.ª o más'].includes(c.SITUACION);
    let signals=overdue>0?1:0; if(cRate!=null&&cRate<80)signals++; if(repeat)signals++;
    return {CURSO_ID:c.ID,NOMBRE:c.NOMBRE,overdue,attendanceRate:cRate,repeat,signals,level:signals>=2?'ROJO':signals===1?'AMARILLO':'VERDE'};
  });
  return {
    organization:{coverage,omissions:omissions.length,weekStatus:current?current.ESTADO:'SIN_PREPARAR',sentOnTime:!!(current&&current.ENVIADO_EN)},
    execution:{compliance,attendanceRate,onTimeRate,evidenceRate},
    streak, courseRisk,
    redCourses:courseRisk.filter(c=>c.level==='ROJO').length,
    yellowCourses:courseRisk.filter(c=>c.level==='AMARILLO').length
  };
}

function indicatorLevel_(value, greenMin, yellowMin) {
  if (value == null) return 'GRIS';
  return value >= greenMin ? 'VERDE' : value >= yellowMin ? 'AMARILLO' : 'ROJO';
}

function selectContextMessage_(user, indicators, currentWeek, messages, dashboard) {
  const role=user.ROL;
  let trigger='';
  if(role==='GABRIEL'){
    if(currentWeek.week && currentWeek.week.ESTADO==='CERRADA' && indicators.execution.compliance===100) trigger='Cumplió toda la semana';
    else if(indicators.streak>=8) trigger='Ocho semanas de constancia';
    else if(indicators.streak>=4) trigger='Cuatro semanas consecutivas cumpliendo';
    else if(currentWeek.week && currentWeek.week.ESTADO==='APROBADA') trigger='Plan aprobado sin correcciones';
    else if(currentWeek.week && currentWeek.week.ENVIADO_EN) trigger='Organizó su semana a tiempo';
    else if(dashboard.overduePendingCount) trigger='Recuperó una actividad atrasada';
  } else if(role==='GLORIA'){
    if(currentWeek.week && currentWeek.week.ESTADO==='ENVIADA') trigger='No ha revisado dentro del plazo';
    else if(currentWeek.week && currentWeek.week.ESTADO==='CERRADA') trigger='Cerró la semana a tiempo';
  } else if(role==='ALEJANDRA'){
    if(indicators.organization.omissions>0) trigger='Se encontró una actividad no declarada';
    else if(dashboard.overduePendingCount) trigger='Gabriel tiene actividades atrasadas';
    else if(indicators.execution.attendanceRate!=null && indicators.execution.attendanceRate<80) trigger='Bajó la asistencia de Gabriel';
    else if(indicators.streak>=4) trigger='Gabriel mantiene cuatro semanas positivas';
    else if(currentWeek.week&&currentWeek.week.ESTADO==='CERRADA'&&indicators.execution.compliance>=90) trigger='Gabriel organizó y cumplió la semana';
  }
  const aliases={GABRIEL:'Gabriel',GLORIA:'Gloria',ALEJANDRA:'Alejandra',ADMIN:'Gabriel'};
  const pool=messages.filter(m=>String(m.DESTINATARIO).toLowerCase()===String(aliases[role]||'Gabriel').toLowerCase());
  const found=pool.find(m=>String(m.DISPARADOR).toLowerCase()===String(trigger).toLowerCase());
  return found || null;
}

function seedMasterMessages_() {
  const existing=readObjects_(APP.SHEETS.MESSAGES);
  if(existing.length) return;
  const rows=[
    ['G-01','Gabriel','Organizó su semana a tiempo','TOMASTE EL CONTROL','Organizaste tu semana a tiempo. Ahora convierte ese plan en acciones concretas.','Motivación','Gerardo Castro | Coach','Mostrar al enviar dentro del plazo.'],
    ['G-02','Gabriel','Plan aprobado sin correcciones','PLANIFICACIÓN SÓLIDA','Tu planificación fue aprobada. Tienes una ruta clara: ejecútala con constancia.','Reconocimiento','Gerardo Castro | Coach','Después de la aprobación.'],
    ['G-03','Gabriel','Cumplió toda la semana','¡LO HICISTE!','Cumpliste los compromisos de la semana. Reconoce el avance y protege este nivel.','Felicitación','Gerardo Castro | Coach','Solo después del cierre validado.'],
    ['G-04','Gabriel','Entregó antes del vencimiento','UN PASO ADELANTE','Te anticipaste al vencimiento. Esa conducta reduce presión y aumenta confiabilidad.','Reconocimiento','Gerardo Castro | Coach','Máximo dos veces por semana.'],
    ['G-05','Gabriel','Mejoró una nota','ESTÁS SUPERANDO TU PROPIA MARCA','Tu resultado mejoró. Mantén lo que funcionó y vuelve a aplicarlo.','Motivación','Gerardo Castro | Coach','Requiere dos resultados comparables.'],
    ['G-06','Gabriel','Aprobó un curso repetido','CONVERTISTE UNA DIFICULTAD EN VICTORIA','Volviste a enfrentar un curso difícil y avanzaste. Esa perseverancia cuenta.','Hito','Gerardo Castro | Coach','Reconocimiento destacado.'],
    ['G-07','Gabriel','Recuperó una actividad atrasada','RECUPERASTE EL CONTROL','Regularizar un atraso es volver a tomar control. Ahora evita que se acumule de nuevo.','Recuperación','Gerardo Castro | Coach','Mantener historial.'],
    ['G-08','Gabriel','Cuatro semanas consecutivas cumpliendo','YA NO ES CASUALIDAD','Cuatro semanas de constancia muestran que estás construyendo disciplina.','Constancia','Gerardo Castro | Coach','Racha verificada.'],
    ['G-09','Gabriel','Ocho semanas de constancia','ESTÁS CONSTRUYENDO AUTONOMÍA','Ocho semanas sosteniendo tus compromisos muestran una autonomía cada vez mayor.','Constancia','Gerardo Castro | Coach','Reconocimiento mayor.'],
    ['G-10','Gabriel','Terminó satisfactoriamente el ciclo','¡CICLO CONQUISTADO!','Terminaste el ciclo con organización, corrección y perseverancia.','Hito','Gerardo Castro | Coach','Resumen final.'],
    ['GL-01','Gloria','Revisó la semana dentro del plazo','SUPERVISIÓN COMPLETADA','Tu revisión permitió que Gabriel avanzara con una ruta clara.','Reconocimiento','Centro académico','Después de aprobar o devolver.'],
    ['GL-02','Gloria','Detectó una actividad omitida','REVISIÓN EFECTIVA','Detectaste un compromiso no considerado. Esa supervisión previene incumplimientos.','Reconocimiento','Centro académico','Omisión confirmada.'],
    ['GL-03','Gloria','Devolvió correctamente una planificación','OBSERVACIÓN OPORTUNA','Señalaste a tiempo lo que debía corregirse antes de aprobar.','Reconocimiento','Centro académico','Con observación.'],
    ['GL-04','Gloria','Verificó todas las evidencias','SEGUIMIENTO CONCLUIDO','Las evidencias quedaron revisadas y la semana correctamente sustentada.','Reconocimiento','Centro académico','Todas revisadas.'],
    ['GL-05','Gloria','Cerró la semana a tiempo','SEMANA VERIFICADA','Comparaste lo planificado con lo realizado y completaste el cierre.','Felicitación','Centro académico','Después del cierre.'],
    ['GL-06','Gloria','No ha revisado dentro del plazo','REVISIÓN PENDIENTE','La planificación de Gabriel está esperando tu revisión.','Recordatorio','Centro académico','Una vez y escalar si persiste.'],
    ['A-01','Alejandra','Gabriel organizó y cumplió la semana','AVANCE DESTACADO DE GABRIEL','Gabriel organizó y cumplió los compromisos de la semana.','Informe positivo','Centro académico','Con porcentaje real.'],
    ['A-02','Alejandra','Gabriel mejoró respecto a la semana anterior','EVOLUCIÓN POSITIVA','Gabriel mejoró su cumplimiento frente a la semana anterior.','Informe positivo','Centro académico','Incluir variación real.'],
    ['A-03','Alejandra','Gabriel mantiene cuatro semanas positivas','PROGRESO SOSTENIDO','Gabriel acumula cuatro semanas positivas de organización y cumplimiento.','Informe positivo','Centro académico','Racha verificada.'],
    ['A-04','Alejandra','Gabriel no organizó su semana','ORGANIZACIÓN PENDIENTE','Gabriel todavía no ha completado la organización de esta semana.','Alerta','Centro académico','Después del plazo.'],
    ['A-05','Alejandra','Gabriel tiene actividades atrasadas','RETRASOS QUE REQUIEREN ATENCIÓN','Gabriel registra actividades vencidas que requieren seguimiento.','Alerta','Centro académico','Mostrar cantidad.'],
    ['A-06','Alejandra','Bajó la asistencia de Gabriel','ALERTA DE ASISTENCIA','La asistencia de Gabriel está por debajo del nivel esperado.','Alerta','Centro académico','Comparar periodos.'],
    ['A-07','Alejandra','Se encontró una actividad no declarada','ACTIVIDAD NO CONSIDERADA','Se identificó una actividad académica que no estaba incluida en la planificación.','Alerta','Centro académico','Omisión confirmada.'],
    ['A-08','Alejandra','Gabriel recuperó sus atrasos','GABRIEL RECUPERÓ SUS PENDIENTES','Gabriel regularizó sus actividades atrasadas y recuperó el orden.','Informe de recuperación','Centro académico','Mantener historial.'],
    ['A-09','Alejandra','Gabriel terminó satisfactoriamente el ciclo','RESULTADO FINAL DEL CICLO','Gabriel completó el ciclo mostrando avances en organización y cumplimiento.','Informe final','Centro académico','Vincular al resumen final.']
  ];
  rows.forEach(r=>appendObject_(APP.SHEETS.MESSAGES,{ID:r[0],DESTINATARIO:r[1],DISPARADOR:r[2],TITULO:r[3],MENSAJE:r[4],TIPO:r[5],EMISOR:r[6],REGLA_USO:r[7],ACTIVO:true}));
}

function setDemoRole(role) {
  const allowed = ['GABRIEL','GLORIA','ALEJANDRA','ADMIN'];
  if (!allowed.includes(role)) throw new Error('Rol no válido.');
  if (!REQUEST_USER_ || REQUEST_USER_.ROL !== 'ADMIN') throw new Error('Solo Gerardo puede cambiar la vista.');
  const target = readObjects_(APP.SHEETS.USERS).find(u => u.ROL === role && truthy_(u.ACTIVO));
  if (target) REQUEST_USER_ = Object.assign({},target,{MODO_DEMO:true});
  return getBootstrap();
}

function seedFamilyPins_() {
  const props = PropertiesService.getScriptProperties();
  const defaults = {GABRIEL:'1111',GLORIA:'2222',ALEJANDRA:'3333',ADMIN:'2026'};
  Object.keys(defaults).forEach(role => {
    if (!props.getProperty('PIN_' + role)) props.setProperty('PIN_' + role, hashPin_(defaults[role]));
  });
}

function resetFamilyPins() {
  const props = PropertiesService.getScriptProperties();
  const pins = {GABRIEL:'1111',GLORIA:'2222',ALEJANDRA:'3333',ADMIN:'2026'};
  Object.keys(pins).forEach(role => props.setProperty('PIN_' + role, hashPin_(pins[role])));
  return 'PIN familiares actualizados correctamente.';
}

function hashPin_(pin) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'GABRIEL_APP|' + clean_(pin));
  return bytes.map(b => ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2)).join('');
}

function enrichProject_(project, actions) {
  const list = actions.filter(a => a.PROYECTO_ID === project.ID && truthy_(a.ACTIVO));
  const completed = list.filter(a => a.ESTADO === 'Completada' || number_(a.AVANCE) >= 100).length;
  const progress = list.length ? Math.round(list.reduce((s,a) => s + number_(a.AVANCE),0)/list.length) : (['Entregado','Calificado','Cerrado','Completado'].includes(project.ESTADO) ? 100 : 0);
  const next = list.filter(a => a.ESTADO !== 'Completada').sort((a,b) => String(a.FECHA_LIMITE).localeCompare(String(b.FECHA_LIMITE)))[0] || null;
  const semaforo = projectLight_(project, progress, next);
  return Object.assign({}, project, {
    PROGRESO: progress,
    TOTAL_ACCIONES: list.length,
    ACCIONES_COMPLETADAS: completed,
    PROXIMA_ACCION: next ? next.TITULO : clean_(project.PROXIMO_PASO),
    PROXIMA_ACCION_FECHA: next ? next.FECHA_LIMITE : clean_(project.FECHA_LIMITE),
    SEMAFORO: semaforo
  });
}

function buildPendingItems_(projects, actions) {
  const items = [];

  // 1. Mostrar todas las acciones pendientes de los proyectos.
  actions
    .filter(a => truthy_(a.ACTIVO) && a.ESTADO !== 'Completada')
    .forEach(a => {
      const project = projects.find(p => p.ID === a.PROYECTO_ID) || {};

      items.push({
        TYPE: 'ACCION',
        ID: a.ID,
        PROJECT_ID: project.ID || '',
        TITLE: a.TITULO,
        PROJECT: project.TITULO || '',
        COURSE: project.CURSO_ID || '',
        DATE: a.FECHA_LIMITE || project.FECHA_LIMITE || '',
        STATUS: a.ESTADO || 'Pendiente',
        SEMAFORO: project.SEMAFORO || 'GRIS',
        PROGRESS: number_(a.AVANCE),
        ACTION_ID: a.ID
      });
    });

  // 2. Mostrar también cada proyecto activo cuando todavía no tiene acciones pendientes.
  //    Así el proyecto siempre aparece en Inicio y Trabajo diario.
  projects
    .filter(p => !['Entregado','Calificado','Completado','Cerrado','Cancelado'].includes(p.ESTADO))
    .forEach(p => {
      const pendingActions = actions.filter(a =>
        truthy_(a.ACTIVO) &&
        a.PROYECTO_ID === p.ID &&
        a.ESTADO !== 'Completada'
      );

      if (!pendingActions.length) {
        items.push({
          TYPE: 'PROYECTO',
          ID: p.ID,
          PROJECT_ID: p.ID,
          TITLE: p.PROXIMO_PASO || p.PROXIMA_ACCION || 'Planificar las acciones del proyecto',
          PROJECT: p.TITULO,
          COURSE: p.CURSO_ID || '',
          DATE: p.FECHA_LIMITE || '',
          STATUS: p.ESTADO || 'No iniciado',
          SEMAFORO: p.SEMAFORO || 'GRIS',
          PROGRESS: number_(p.PROGRESO),
          ACTION_ID: ''
        });
      }
    });

  // 3. Ordenar primero por urgencia del semáforo y luego por fecha límite.
  const lightOrder = {ROJO: 1, AMARILLO: 2, VERDE: 3, AZUL: 4, GRIS: 5};

  return items.sort((a, b) => {
    const lightDifference =
      (lightOrder[a.SEMAFORO] || 9) -
      (lightOrder[b.SEMAFORO] || 9);

    if (lightDifference !== 0) return lightDifference;

    const dateA = a.DATE || '9999-12-31';
    const dateB = b.DATE || '9999-12-31';
    return dateA.localeCompare(dateB);
  });
}

function buildWeekClasses_(sessions, attendance) {
  const bounds = weekBounds_(new Date());
  const dayIndex = {'Lunes':0,'Martes':1,'Miércoles':2,'Jueves':3,'Viernes':4,'Sábado':5,'Domingo':6};
  return sessions.filter(s => truthy_(s.ACTIVO)).map(s => {
    const d = new Date(bounds.start + 'T12:00:00');
    d.setDate(d.getDate() + (dayIndex[s.DIA] || 0));
    const date = dateOnly_(d);
    const mark = attendance.find(a => a.SESION_ID === s.ID && a.FECHA === date) || attendance.find(a => a.CURSO_ID === s.CURSO_ID && a.FECHA === date);
    return {
      ID:'CLASE-' + s.ID + '-' + date,
      SESION_ID:s.ID,
      CURSO_ID:s.CURSO_ID,
      DIA:s.DIA,
      FECHA:date,
      HORA_INICIO:s.HORA_INICIO,
      HORA_FIN:s.HORA_FIN,
      MODALIDAD:s.MODALIDAD,
      AULA_ENLACE:s.AULA_ENLACE || '',
      ESTADO: mark ? mark.ESTADO : 'Pendiente de marcar',
      REGISTRO_ID: mark ? mark.ID : '',
      TEMA_CLASE: mark ? mark.TEMA_CLASE : '',
      COMPROMISOS: mark ? mark.COMPROMISOS : ''
    };
  }).sort((a,b)=> String(a.FECHA).localeCompare(String(b.FECHA)) || String(a.HORA_INICIO).localeCompare(String(b.HORA_INICIO)));
}

function buildDashboard_(config, enrollment, courses, sessions, projects, actions, dailyReports, attendance, pendingItems, weekClasses) {
  const today = dateOnly_(new Date());
  const prep = buildPreparationProgress_(enrollment, courses, sessions);
  const preparationComplete = prep.percent === 100;
  const activeProjects = projects.filter(p => !['Calificado','Completado','Cerrado','Cancelado'].includes(p.ESTADO));
  const red = activeProjects.filter(p => p.SEMAFORO === 'ROJO');
  const yellow = activeProjects.filter(p => p.SEMAFORO === 'AMARILLO');
  const todayPending = pendingItems.filter(i => i.DATE === today);
  const weekLimit = addDaysIso_(today, 7);
  const monthLimit = addDaysIso_(today, 30);
  const weekPending = pendingItems.filter(i => i.DATE && i.DATE >= today && i.DATE <= weekLimit);
  const monthPending = pendingItems.filter(i => i.DATE && i.DATE >= today && i.DATE <= monthLimit);
  const todayClasses = weekClasses.filter(c => c.FECHA === today);
  const missingScheduleCourses = courses.filter(c => !sessions.some(s => s.CURSO_ID === c.ID));
  const overduePendingCount = pendingItems.filter(i => i.DATE && i.DATE < today).length;
  const todayAttendancePendingCount = todayClasses.filter(c => c.ESTADO === 'Pendiente de marcar').length;
  const last30 = addDaysIso_(today, -29);
  const reports30 = dailyReports.filter(r => r.FECHA >= last30 && r.FECHA <= today);
  const todayReports = dailyReports.filter(r => r.FECHA === today);
  const attendanceCount = attendance.length;
  const absences = attendance.filter(a => ['No asistió','Faltó'].includes(a.ESTADO)).length;
  const presentCount = attendance.filter(a => ['Asistió','Tardanza'].includes(a.ESTADO)).length;
  const attendanceRate = attendanceCount ? Math.round(presentCount / attendanceCount * 100) : null;
  return {
    studentName: config.ESTUDIANTE || enrollment.ESTUDIANTE || 'Estudiante',
    activePhase: preparationComplete ? 'SEGUIMIENTO' : 'PREPARACION',
    preparationComplete,
    preparationProgress: prep.percent,
    preparationSteps: prep.steps,
    todayPendingCount: todayPending.length,
    weekPendingCount: weekPending.length,
    monthPendingCount: monthPending.length,
    totalPendingCount: pendingItems.length,
    activeProjectsCount: activeProjects.length,
    completedProjectsCount: projects.filter(p => ['Calificado','Cerrado','Completado'].includes(p.ESTADO)).length,
    redProjectsCount: red.length,
    yellowProjectsCount: yellow.length,
    nextProjects: activeProjects.sort((a,b) => String(a.FECHA_LIMITE).localeCompare(String(b.FECHA_LIMITE))).slice(0,5),
    todayClasses,
    missingScheduleCourses,
    missingScheduleCount: missingScheduleCourses.length,
    scheduleCoverage: courses.length ? Math.round((courses.length - missingScheduleCourses.length) / courses.length * 100) : 0,
    overduePendingCount,
    todayAttendancePendingCount,
    dailyHours30: round2_(reports30.reduce((s,r)=>s + number_(r.HORAS),0)),
    reportedToday: todayReports.length > 0,
    reportsTodayCount: todayReports.length,
    attendanceRate,
    attendanceCount,
    absences,
    semaforo: red.length || overduePendingCount || todayPending.length ? 'ROJO' : yellow.length || weekPending.length ? 'AMARILLO' : activeProjects.length ? 'VERDE' : preparationComplete ? 'AZUL' : 'GRIS'
  };
}

function buildPreparationProgress_(enrollment, courses, sessions) {
  const milestones = [
    !!clean_(enrollment.CICLO),
    !!clean_(enrollment.FECHA_MATRICULA),
    !!clean_(enrollment.ESTADO_PAGO) && enrollment.ESTADO_PAGO !== 'Pendiente',
    !!clean_(enrollment.EVIDENCIA_URL),
    courses.length > 0 && courses.every(c => sessions.some(s => s.CURSO_ID === c.ID))
  ];
  const completed = milestones.filter(Boolean).length;
  return {
    percent: Math.round(completed / milestones.length * 100),
    steps: [
      {PASO:1,NOMBRE:'Ciclo',COMPLETO:milestones[0]},
      {PASO:2,NOMBRE:'Registro de matrícula',COMPLETO:milestones[1]},
      {PASO:3,NOMBRE:'Pago de matrícula',COMPLETO:milestones[2]},
      {PASO:4,NOMBRE:'Evidencia',COMPLETO:milestones[3]},
      {PASO:5,NOMBRE:'Cursos y horarios',COMPLETO:milestones[4]}
    ]
  };
}

function projectLight_(project, progress, nextAction) {
  const today = dateOnly_(new Date());
  const date = nextAction ? nextAction.FECHA_LIMITE : project.FECHA_LIMITE;
  if (['Entregado','Calificado','Cerrado','Completado'].includes(project.ESTADO)) return 'VERDE';
  if (date && date < today) return 'ROJO';
  if (date && daysBetween_(today, date) <= 2) return 'AMARILLO';
  if (progress === 0 || project.ESTADO === 'No iniciado') return 'GRIS';
  return 'VERDE';
}

function permissionsFor_(role) {
  return {
    editAcademic: ['GABRIEL','ADMIN'].includes(role),
    editWork: ['GABRIEL','ADMIN'].includes(role),
    editAgenda: ['GABRIEL','ADMIN'].includes(role),
    superviseWeek: ['GLORIA','ADMIN'].includes(role),
    admin: role === 'ADMIN',
    familyView: ['GLORIA','ALEJANDRA','ADMIN'].includes(role),
    superviseWeek: ['GLORIA','ADMIN'].includes(role),
    editAgenda: ['GABRIEL','ADMIN'].includes(role)
  };
}

function getConfigMap_() {
  const map = {};
  readObjects_(APP.SHEETS.CONFIG).forEach(r => map[r.CLAVE] = r.VALOR);
  return map;
}

function getStudentProfile_() {
  const cfg = getConfigMap_();
  return {
    ESTUDIANTE: cfg.ESTUDIANTE || 'Gabriel Romero',
    CARRERA: cfg.CARRERA || 'Gastronomía y Gestión de Restaurantes',
    CAMPUS: cfg.CAMPUS || 'UPN Trujillo El Molino'
  };
}

function getEnrollment_() {
  const rows = readObjects_(APP.SHEETS.ENROLLMENT);
  if (rows.length) return rows[rows.length - 1];
  const p = getStudentProfile_();
  return {
    ID:'', PERIODO:getConfigMap_().PERIODO || '2026-2', ESTUDIANTE:p.ESTUDIANTE, CARRERA:p.CARRERA, CAMPUS:p.CAMPUS,
    CICLO:'', APERTURA_MATRICULA:'', LIMITE_MATRICULA:'', FECHA_MATRICULA:'', INICIO_CLASES:'', TERMINO_MATRICULA:'',
    ESTADO_PAGO:'Pendiente', EVIDENCIA_URL:''
  };
}

function currentUser_() {
  if (REQUEST_USER_) return REQUEST_USER_;
  return {ID:'DEMO',NOMBRE:'Usuario',ROL:'ADMIN',ACTIVO:true,MODO_DEMO:true};
}

function requireRole_(roles) {
  const user = currentUser_();
  if (!roles.includes(user.ROL)) throw new Error('No tienes permisos para realizar esta acción.');
  return user;
}

function setupDatabase_() {
  const ss = SpreadsheetApp.openById(APP.SPREADSHEET_ID);
  Object.keys(SCHEMA).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = SCHEMA[name];
    if (sh.getLastRow() === 0) {
      sh.getRange(1,1,1,headers.length).setValues([headers]);
      sh.setFrozenRows(1);
      sh.getRange(1,1,1,headers.length).setBackground('#17324D').setFontColor('#FFFFFF').setFontWeight('bold');
    } else {
      const current = sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
      const missing = headers.filter(h => !current.includes(h));
      if (missing.length) sh.getRange(1,sh.getLastColumn()+1,1,missing.length).setValues([missing]);
    }
  });
}

function seedDefaults_() {
  if (!readObjects_(APP.SHEETS.CONFIG).length) {
    [
      ['ESTUDIANTE','Gabriel Romero','Nombre del estudiante'],
      ['CARRERA','Gastronomía y Gestión de Restaurantes','Carrera'],
      ['CAMPUS','UPN Trujillo El Molino','Campus'],
      ['PERIODO','2026-2','Periodo activo'],
      ['WEBSITE','www.superaloya.com','Sitio']
    ].forEach(r => appendObject_(APP.SHEETS.CONFIG, {CLAVE:r[0],VALOR:r[1],DESCRIPCION:r[2]}));
  }
  if (!readObjects_(APP.SHEETS.MESSAGES).length) {
    [
      ['G-01','GABRIEL','SEMANA_ENVIADA','TOMASTE EL CONTROL','Organizaste tu semana y definiste una ruta. Ahora conviértela en acción.','Motivación','Gerardo Castro | Coach','Mostrar al enviar dentro del plazo'],
      ['G-02','GABRIEL','SEMANA_APROBADA','PLANIFICACIÓN SÓLIDA','Tu planificación fue aprobada. Tienes una ruta clara para ejecutar la semana.','Reconocimiento','Gerardo Castro | Coach','Mostrar después de la aprobación'],
      ['G-03','GABRIEL','SEMANA_CERRADA','¡LO HICISTE!','Cumpliste y cerraste la semana con seguimiento verificable. Reconoce este avance.','Felicitación','Gerardo Castro | Coach','Solo después del cierre validado'],
      ['GL-01','GLORIA','REVISION_COMPLETADA','SUPERVISIÓN COMPLETADA','La revisión quedó registrada y Gabriel puede avanzar con una ruta validada.','Reconocimiento','Centro académico','Después de aprobar o devolver'],
      ['A-05','ALEJANDRA','ATRASOS','RETRASOS QUE REQUIEREN ATENCIÓN','Gabriel registra actividades vencidas que todavía requieren atención.','Alerta','Centro académico','Mostrar cantidad y vencimiento más antiguo']
    ].forEach(r => appendObject_(APP.SHEETS.MESSAGES,{ID:r[0],DESTINATARIO:r[1],DISPARADOR:r[2],TITULO:r[3],MENSAJE:r[4],TIPO:r[5],EMISOR:r[6],REGLA_USO:r[7],ACTIVO:true}));
  }
  if (!readObjects_(APP.SHEETS.USERS).length) {
    [
      ['Gabriel Romero','GABRIEL'],['Gloria','GLORIA'],['Alejandra','ALEJANDRA'],['Gerardo Castro','ADMIN']
    ].forEach(r => appendObject_(APP.SHEETS.USERS, {ID:'USR-' + Utilities.getUuid(),EMAIL:'',NOMBRE:r[0],ROL:r[1],ACTIVO:true,CREADO_EN:now_(),ACTUALIZADO_EN:now_()}));
  }
}

function upsertConfig_(key, value, desc) {
  const rows = readObjects_(APP.SHEETS.CONFIG);
  const found = rows.find(r => r.CLAVE === key);
  upsert_(APP.SHEETS.CONFIG, {CLAVE:key, VALOR:clean_(value), DESCRIPCION:desc || (found ? found.DESCRIPCION : '')}, 'CLAVE');
}

function weekBounds_(date) {
  const d = new Date(date);
  const day = d.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + delta);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {start: dateOnly_(start), end: dateOnly_(end)};
}

function daysBetween_(start, end) {
  return Math.round((new Date(end + 'T12:00:00') - new Date(start + 'T12:00:00'))/86400000);
}

function addDaysIso_(iso, amount) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + amount);
  return dateOnly_(d);
}

function readObjects_(sheetName) {
  const sh = SpreadsheetApp.openById(APP.SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(1,1,sh.getLastRow(),sh.getLastColumn()).getDisplayValues();
  const headers = values.shift();
  return values.filter(r => r.some(v => v !== '')).map(r => Object.fromEntries(headers.map((h,i) => [h, r[i]])));
}

/**
 * Devuelve los encabezados FÍSICOS de la hoja y garantiza que todas las
 * columnas del SCHEMA existan. No reordena ni elimina columnas heredadas.
 * Esto permite convivir con versiones anteriores de la base de datos.
 */
function physicalHeaders_(sh, sheetName) {
  const schema = SCHEMA[sheetName] || [];

  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    if (!schema.length) return [];
    sh.getRange(1, 1, 1, schema.length).setValues([schema]);
    sh.setFrozenRows(1);
    return schema.slice();
  }

  let lastColumn = sh.getLastColumn();
  let headers = sh.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(clean_);
  const missing = schema.filter(h => !headers.includes(h));

  if (missing.length) {
    sh.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
    lastColumn += missing.length;
    headers = sh.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(clean_);
  }

  return headers;
}

/**
 * Inserta usando el nombre REAL de cada encabezado, no su posición en SCHEMA.
 * Las columnas antiguas que ya no usa la app quedan vacías en registros nuevos,
 * pero permanecen intactas para los registros históricos.
 */
function appendObject_(sheetName, obj) {
  const sh = SpreadsheetApp.openById(APP.SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sh) throw new Error('No existe la hoja: ' + sheetName);

  const headers = physicalHeaders_(sh, sheetName);
  const row = headers.map(h =>
    Object.prototype.hasOwnProperty.call(obj, h) ? valueForSheet_(obj[h]) : ''
  );

  sh.getRange(sh.getLastRow() + 1, 1, 1, headers.length).setValues([row]);
}

/**
 * Actualiza por nombre de columna y conserva cualquier columna heredada.
 * Si el registro existe, parte de la fila actual y reemplaza únicamente los
 * campos presentes en `obj`. Si no existe, crea una fila nueva mapeada por
 * encabezado físico.
 */
function upsert_(sheetName, obj, key) {
  const sh = SpreadsheetApp.openById(APP.SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sh) throw new Error('No existe la hoja: ' + sheetName);

  const headers = physicalHeaders_(sh, sheetName);
  const keyIndex = headers.indexOf(key);
  if (keyIndex < 0) throw new Error('No existe la columna clave "' + key + '" en ' + sheetName + '.');

  const lastRow = sh.getLastRow();
  const values = lastRow > 1
    ? sh.getRange(1, 1, lastRow, headers.length).getDisplayValues()
    : [headers];

  const rowIndex = values.findIndex((r, i) =>
    i > 0 && String(r[keyIndex]) === String(obj[key])
  );

  if (rowIndex >= 1) {
    const rowNumber = rowIndex + 1;
    const currentRow = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0];

    Object.keys(obj).forEach(field => {
      const colIndex = headers.indexOf(field);
      if (colIndex >= 0) currentRow[colIndex] = valueForSheet_(obj[field]);
    });

    sh.getRange(rowNumber, 1, 1, headers.length).setValues([currentRow]);
  } else {
    const row = headers.map(h =>
      Object.prototype.hasOwnProperty.call(obj, h) ? valueForSheet_(obj[h]) : ''
    );
    sh.getRange(lastRow + 1, 1, 1, headers.length).setValues([row]);
  }
}

function findById_(sheetName, id) {
  return readObjects_(sheetName).find(r => r.ID === id) || null;
}

function audit_(user, action, entity, entityId, detail) {
  appendObject_(APP.SHEETS.AUDIT, {ID:'AUD-' + Utilities.getUuid(), FECHA_HORA:now_(), USUARIO:user.NOMBRE, ROL:user.ROL, ACCION:action, ENTIDAD:entity, ENTIDAD_ID:entityId, DETALLE_JSON:JSON.stringify(detail || {})});
}

function now_(){return Utilities.formatDate(new Date(), APP.TZ, "yyyy-MM-dd'T'HH:mm:ss");}
function dateOnly_(d){return Utilities.formatDate(d, APP.TZ, 'yyyy-MM-dd');}
function clean_(v){return String(v == null ? '' : v).trim();}
function number_(v){const n = Number(v || 0); return Number.isFinite(n) ? n : 0;}
function truthy_(v){return v===true || ['true','sí','si','1'].includes(String(v).toLowerCase());}
function clamp_(v,min,max){return Math.max(min,Math.min(max,number_(v)));}
function round2_(v){return Math.round(number_(v)*100)/100;}
function valueForSheet_(v){return v == null ? '' : v;}
