# JN | 2026 — Caja de la juntada anual con amigos

App web para llevar el control de los aportes y gastos mensuales que hacemos
con amigos para financiar **JN**, nuestra juntada anual.

Cada integrante aporta su cuota mes a mes, y con esa plata se cubren los gastos
del encuentro. La app permite registrar todo y ver en qué estado está la caja
en cualquier momento.

## Qué hace

- **Resumen**: estado general de la caja (aportado, gastado, saldo), gasto por
  categoría y estado de cuotas permitiendo ver qué integrantes están al día o atrasados.
- **Dashboard**: gráficos de aportado vs gastado por mes, objetivo vs alcanzado,
  aporte por persona y gasto por categoría.
- **Personas**: detalle por integrante de aportes, gastos y total, mes a mes.
- **Aportes**: carga de aportes y administración de la cuota mensual (solo administrador).
- **Gastos**: carga de gastos por tipo y categoría (solo administrador).

## Cómo está hecha

- HTML, CSS y JavaScript sin frameworks (archivos estáticos).
- [Supabase](https://supabase.com) como base de datos y autenticación.

Solo el administrador inicia sesión para cargar movimientos; el resto del grupo
puede ver toda la información sin necesidad de entrar.

## Estructura

- `index.html` / `app.js` — Aportes
- `gastos.html` / `gastos.js` — Gastos
- `personas.html` / `personas.js` — Personas
- `dashboard.html` / `dashboard.js` — Resumen
- `graficos.html` / `graficos.js` — Dashboard
- `estilos.css` — estilos compartidos
