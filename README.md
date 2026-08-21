# Centro de Planificación y Seguimiento Académico — Gabriel

Sistema académico familiar desarrollado con **Google Apps Script + Google Sheets**.

## Proposito
Ayudar a Gabriel a organizar su ciclo académico, registrar cursos y horarios, administrar compromisos, planificar su semana, ejecutar actividades, registrar asistencia y evidencias, y permitir la supervisión familiar con roles diferenciados.

## Flujo maestro
1. Preparación del ciclo
2. Cursos y horarios
3. Agenda académica
4. Organización semanal
5. Envío a supervisión
6. Revisión de Gloria
7. Ejecución y asistencia
8. Cierre semanal
9. Indicadores y dashboard familiar

## Roles
- **Gabriel:** registra, organiza y ejecuta.
- **Gloria:** supervisa, aprueba/devuelve y cierra la semana.
- **Alejandra:** consulta el dashboard familiar.
- **Gerardo / ADMIN:** administra y puede reabrir excepcionalmente.
- **Pamela** user

## Archivos
- `Code.gs` — backend completo de Apps Script.
- `Index.html` — interfaz completa responsive.
- `appsscript.json` — manifiesto del proyecto.
- `VALIDACION_FINAL.txt` — validación técnica.
- `VERSION.json` — versión maestra de referencia.

## Base de datos
Hojas principales:
- DB_Config
- DB_Usuarios
- DB_Matricula
- DB_Cursos
- DB_Horarios
- DB_Actividades
- DB_Proyectos
- DB_Integrantes_Proyecto
- DB_Acciones
- DB_Semanas
- DB_Plan_Semanal
- DB_Reportes_Diarios
- DB_Asistencia
- DB_Revisiones
- DB_Mensajes
- DB_Auditoria

## Corrección incluida
Al retirar un curso:
- el curso pasa a inactivo;
- sus horarios asociados también pasan a inactivos;
- horarios de cursos retirados no generan falsos cruces;
- la validación de conflicto usa solo cursos y horarios activos;
- un cruce real identifica curso y rango horario.

## Instalación
1. Abrir el proyecto de Google Apps Script.
2. Reemplazar `Code.gs`.
3. Crear/reemplazar `Index.html`.
4. Mostrar `appsscript.json` desde Configuración del proyecto y reemplazarlo.
5. Guardar.
6. Ejecutar `setupApp()` una vez para autorizar.
7. Implementar como **Aplicación web**.
8. Probar los cuatro roles.

## Base para demostración
Para explicar el sistema desde cero, puede mantenerse:
- configuración;
- usuarios;
- matrícula;
- cursos;

y dejar vacíos horarios, proyectos, acciones, actividades, semanas, reportes, asistencia y revisiones.

## Versión de referencia
**GitHub Reference v1.0 — Code.gs FINAL v8 + Index FINAL v5.**

A partir de esta versión, cualquier mejora debe hacerse sobre este repositorio maestro para evitar divergencias entre copias.
