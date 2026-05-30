# AC Manager - Calculadora de Presupuestos y Servicios Técnicos

## Objetivos del Proyecto

AC Manager es una aplicación web desarrollada para facilitar la creación de cotizaciones para servicios técnicos. Permite ingresar costos de repuestos y mano de obra, calcular automáticamente el IVA y el precio final, guardar el historial de cotizaciones y generar documentos PDF profesionales.

### Alcance
- Registro e inicio de sesión de usuarios.
- Cálculo automático de presupuestos.
- Historial de cotizaciones.
- Generación de PDF.
- Almacenamiento de datos en la nube mediante Supabase.

---

## Arquitectura del Software

```text
Usuario
   │
   ▼
Frontend (HTML, CSS, JavaScript)
   │
   ▼
Lógica de negocio
(Cálculos, historial, PDF)
   │
   ▼
Supabase API
   │
   ▼
Base de Datos PostgreSQL
(Tabla: presupuestos)
```

### Flujo de funcionamiento

1. El usuario accede a la página.
2. Inicia sesión o crea una cuenta.
3. Ingresa los datos de la cotización.
4. El sistema calcula subtotal, IVA y total.
5. La información se almacena en Supabase.
6. La cotización puede descargarse en PDF.

---

## Stack Tecnológico

- HTML5
- CSS3
- JavaScript (ES6)
- Supabase
- PostgreSQL
- jsPDF
- GitHub
- GitHub Pages

---

## Modelo de Datos

### Tipo de Base de Datos

Base de datos **Relacional** utilizando PostgreSQL mediante Supabase.

### Ubicación

Base de datos **externa en la nube** alojada en Supabase.

### Tabla principal: presupuestos

| Campo | Tipo |
|---------|---------|
| id | int8 |
| created_at | timestamptz |
| cliente | text |
| dispositivo | text |
| repuestos | float8 |
| mano_obra | float8 |
| iva | float8 |
| total | float8 |
| email | text |
| fecha_creacion | timestamptz |

---

## Metodología con IA

Durante el desarrollo del proyecto se utilizaron herramientas de Inteligencia Artificial como Antigravity y Gemini para acelerar la generación de código, mejorar el diseño visual y apoyar en la solución de errores.

La IA fue utilizada para:
- Generación de estructuras HTML y CSS.
- Corrección de errores en JavaScript.
- Integración con Supabase.
- Optimización del diseño de los PDF.
- Documentación y organización del proyecto.

Las decisiones finales, pruebas, personalización y validación del funcionamiento fueron realizadas por el desarrollador del proyecto.

---

## Estado del Proyecto

Proyecto funcional con:
- Registro de usuarios.
- Cálculo automático de presupuestos.
- Historial de cotizaciones.
- Almacenamiento en Supabase.
- Generación de PDF profesional.
