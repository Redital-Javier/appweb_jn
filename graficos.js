const supabaseUrl = 'https://shoxdhweozhoiderszai.supabase.co';
const supabaseKey = 'sb_publishable_0Z63lp6EYq54uUbxCfWQsw_lDXmLaMb';
const cliente = supabase.createClient(supabaseUrl, supabaseKey);

Chart.register(ChartDataLabels);

const mesesCorto = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const mesesLargo = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const colorCyan = '#2FD6C0';
const colorCyanOscuro = '#178A7C';
const colorRojo = '#F4566B';
const colorRojoOscuro = '#B23F50';
const colorMuted = '#8997A8';
const colorSuave = '#AEB9C7';
const colorTinta = '#E7ECF3';

function pesos(n) {
    const negativo = n < 0;
    return (negativo ? '-' : '') + '$' + Math.abs(n).toLocaleString('es-AR');
}

function pesosCorto(n) {
    const valor = Math.abs(n);
    let texto;
    if (valor >= 1000000) {
        texto = (valor / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' M';
    } else if (valor >= 1000) {
        texto = Math.round(valor / 1000) + ' k';
    } else {
        texto = String(valor);
    }
    return (n < 0 ? '-' : '') + '$' + texto;
}

function rotuloMes(clave) {
    const mes = Number(clave.substring(5, 7));
    const anio = clave.substring(2, 4);
    const nombre = mesesCorto[mes - 1];
    return nombre.charAt(0).toUpperCase() + nombre.slice(1) + ' ' + anio;
}

function mesLargo(fecha) {
    const mes = Number(fecha.substring(5, 7));
    const anio = fecha.substring(0, 4);
    const nombre = mesesLargo[mes - 1];
    return nombre.charAt(0).toUpperCase() + nombre.slice(1) + ' ' + anio;
}

function sinDatos(idCanvas, texto) {
    document.getElementById(idCanvas).parentElement.innerHTML = '<div class="vacio">' + texto + '</div>';
}

function gradiente(context, c1, c2, horizontal) {
    const chart = context.chart;
    const area = chart.chartArea;
    if (!area) {
        return c2;
    }
    const ctx = chart.ctx;
    const g = horizontal
        ? ctx.createLinearGradient(area.left, 0, area.right, 0)
        : ctx.createLinearGradient(0, area.bottom, 0, area.top);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
}

function ejeCategoria() {
    return {
        grid: { display: false },
        border: { display: false },
        ticks: { color: colorTinta, font: { weight: '400', size: 12 }, padding: 8 }
    };
}

async function cargar() {
    const { data: resumen, error: e1 } = await cliente
        .from('resumen_personas')
        .select('id, nombre, aportado, gastado')
        .order('nombre');
    if (e1) { console.error(e1); return; }

    const { data: aportes, error: e2 } = await cliente
        .from('aportes')
        .select('integrante_id, monto, periodo');
    if (e2) { console.error(e2); return; }

    const { data: gastos, error: e3 } = await cliente
        .from('gastos')
        .select('monto, fecha, tipos_gasto(nombre, categorias(nombre))');
    if (e3) { console.error(e3); return; }

    const { data: cuotas, error: e4 } = await cliente
        .from('cuotas')
        .select('periodo, monto_por_persona');
    if (e4) { console.error(e4); return; }

    const { count: cantIntegrantes, error: e5 } = await cliente
        .from('integrantes')
        .select('*', { count: 'exact', head: true });
    if (e5) { console.error(e5); return; }

    graficoAportadoGastado(aportes, gastos);
    graficoObjetivo(aportes, cuotas, cantIntegrantes);
    dibujarAportePersona(resumen, aportes);
    dibujarCategorias(gastos);
}

function graficoAportadoGastado(aportes, gastos) {
    const meses = {};

    aportes.forEach(function (a) {
        const clave = a.periodo.substring(0, 7);
        if (!meses[clave]) { meses[clave] = { aportado: 0, gastado: 0 }; }
        meses[clave].aportado += Number(a.monto);
    });

    gastos.forEach(function (g) {
        const clave = g.fecha.substring(0, 7);
        if (!meses[clave]) { meses[clave] = { aportado: 0, gastado: 0 }; }
        meses[clave].gastado += Number(g.monto);
    });

    const claves = Object.keys(meses).sort();

    if (claves.length === 0) {
        sinDatos('gAporteGasto', 'Todavía no hay movimientos cargados.');
        return;
    }

    new Chart(document.getElementById('gAporteGasto'), {
        type: 'bar',
        data: {
            labels: claves.map(rotuloMes),
            datasets: [
                {
                    label: 'Aportado',
                    data: claves.map(function (c) { return meses[c].aportado; }),
                    backgroundColor: function (c) { return gradiente(c, colorCyanOscuro, colorCyan, false); },
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 34,
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        color: colorCyan,
                        font: { weight: '400', size: 11 },
                        formatter: function (v) { return v > 0 ? pesosCorto(v) : ''; }
                    }
                },
                {
                    label: 'Gastado',
                    data: claves.map(function (c) { return meses[c].gastado; }),
                    backgroundColor: function (c) { return gradiente(c, colorRojoOscuro, colorRojo, false); },
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 34,
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        color: colorRojo,
                        font: { weight: '400', size: 11 },
                        formatter: function (v) { return v > 0 ? pesosCorto(v) : ''; }
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 28 } },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: ejeCategoria(),
                y: { display: false, beginAtZero: true, grace: '22%' }
            }
        }
    });
}

function graficoObjetivo(aportes, cuotas, cantIntegrantes) {
    if (!cuotas || cuotas.length === 0) {
        sinDatos('gObjetivo', 'Cargá las cuotas en la pestaña Aportes para ver el objetivo.');
        return;
    }

    const orden = cuotas.slice().sort(function (a, b) {
        return a.periodo.localeCompare(b.periodo);
    });

    const labels = [];
    const objetivo = [];
    const aportado = [];

    orden.forEach(function (c) {
        const clave = c.periodo.substring(0, 7);
        labels.push(rotuloMes(clave));
        objetivo.push(Number(c.monto_por_persona) * cantIntegrantes);

        let suma = 0;
        aportes.forEach(function (a) {
            if (a.periodo.substring(0, 7) === clave) {
                suma += Number(a.monto);
            }
        });
        aportado.push(suma);
    });

    const maxVal = Math.max.apply(null, objetivo.concat(aportado));

    function colorAlcanzado(i) {
        return aportado[i] >= objetivo[i] ? colorCyan : colorRojo;
    }

    new Chart(document.getElementById('gObjetivo'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Alcanzado',
                    data: aportado,
                    showLine: false,
                    pointRadius: 9,
                    pointHoverRadius: 9,
                    backgroundColor: colorCyan,
                    borderColor: colorCyan,
                    pointBackgroundColor: function (c) { return colorAlcanzado(c.dataIndex); },
                    pointBorderColor: function (c) { return colorAlcanzado(c.dataIndex); },
                    datalabels: {
                        align: 'top',
                        anchor: 'center',
                        offset: 14,
                        color: function (c) { return colorAlcanzado(c.dataIndex); },
                        font: { weight: '400', size: 12 },
                        formatter: function (v) { return pesos(v); }
                    }
                },
                {
                    label: 'Objetivo',
                    data: objetivo,
                    showLine: false,
                    pointRadius: 9,
                    pointHoverRadius: 9,
                    pointStyle: 'circle',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: colorSuave,
                    pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                    pointBorderColor: colorSuave,
                    pointBorderWidth: 2,
                    datalabels: {
                        align: 'bottom',
                        anchor: 'center',
                        offset: 14,
                        color: colorSuave,
                        font: { weight: '400', size: 11 },
                        formatter: function (v) { return pesos(v); }
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 24, bottom: 24, left: 90, right: 90 } },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: ejeCategoria(),
                y: { display: false, beginAtZero: true, max: maxVal * 1.15 }
            }
        }
    });
}

function dibujarAportePersona(resumen, aportes) {
    const porPersona = {};
    resumen.forEach(function (p) {
        porPersona[p.id] = { nombre: p.nombre, monto: 0, meses: {} };
    });

    aportes.forEach(function (a) {
        if (!porPersona[a.integrante_id]) {
            return;
        }
        const clave = a.periodo.substring(0, 7);
        porPersona[a.integrante_id].monto += Number(a.monto);
        porPersona[a.integrante_id].meses[clave] = (porPersona[a.integrante_id].meses[clave] || 0) + Number(a.monto);
    });

    const filas = Object.keys(porPersona)
        .map(function (id) { return porPersona[id]; })
        .sort(function (a, b) { return b.monto - a.monto; });

    const contenedor = document.getElementById('aportePersona');
    if (filas.length === 0) {
        contenedor.innerHTML = '<div class="vacio">Todavía no hay integrantes cargados.</div>';
        return;
    }

    const maximo = filas[0].monto;
    let html = '';
    filas.forEach(function (f) {
        const ancho = maximo > 0 ? (f.monto / maximo) * 100 : 0;

        const meses = Object.keys(f.meses).map(function (m) {
            return { clave: m, monto: f.meses[m] };
        });
        meses.sort(function (a, b) { return b.clave.localeCompare(a.clave); });

        let mesesHtml = '';
        if (meses.length === 0) {
            mesesHtml = '<div class="sin-gastos">Sin aportes.</div>';
        } else {
            meses.forEach(function (m) {
                mesesHtml +=
                    '<div class="cat-tipo">' +
                        '<span>' + mesLargo(m.clave + '-01') + '</span>' +
                        '<span class="cat-tipo-monto">' + pesos(m.monto) + '</span>' +
                    '</div>';
            });
        }

        html +=
            '<div class="cat-fila">' +
                '<div class="cat-cab">' +
                    '<span class="flecha"></span>' +
                    '<span class="cat-nombre">' + f.nombre + '</span>' +
                    '<span class="cat-monto">' + pesos(f.monto) + '</span>' +
                '</div>' +
                '<div class="cat-barra"><div class="cat-relleno" style="width:' + ancho + '%"></div></div>' +
                '<div class="cat-tipos oculto">' + mesesHtml + '</div>' +
            '</div>';
    });

    contenedor.innerHTML = html;
}

function dibujarCategorias(gastos) {
    const porCategoria = {};
    gastos.forEach(function (g) {
        const cat = g.tipos_gasto.categorias.nombre;
        const tipo = g.tipos_gasto.nombre;
        if (!porCategoria[cat]) {
            porCategoria[cat] = { monto: 0, tipos: {} };
        }
        porCategoria[cat].monto += Number(g.monto);
        porCategoria[cat].tipos[tipo] = (porCategoria[cat].tipos[tipo] || 0) + Number(g.monto);
    });

    const filas = Object.keys(porCategoria).map(function (cat) {
        return { categoria: cat, monto: porCategoria[cat].monto, tipos: porCategoria[cat].tipos };
    });
    filas.sort(function (a, b) { return b.monto - a.monto; });

    const contenedor = document.getElementById('categorias');
    if (filas.length === 0) {
        contenedor.innerHTML = '<div class="vacio">Todavía no hay gastos cargados.</div>';
        return;
    }

    const maximo = filas[0].monto;
    let html = '';
    filas.forEach(function (f) {
        const ancho = maximo > 0 ? (f.monto / maximo) * 100 : 0;

        const tipos = Object.keys(f.tipos).map(function (t) {
            return { nombre: t, monto: f.tipos[t] };
        });
        tipos.sort(function (a, b) { return b.monto - a.monto; });

        let tiposHtml = '';
        tipos.forEach(function (t) {
            tiposHtml +=
                '<div class="cat-tipo">' +
                    '<span>' + t.nombre + '</span>' +
                    '<span class="cat-tipo-monto">' + pesos(t.monto) + '</span>' +
                '</div>';
        });

        html +=
            '<div class="cat-fila">' +
                '<div class="cat-cab">' +
                    '<span class="flecha"></span>' +
                    '<span class="cat-nombre">' + f.categoria + '</span>' +
                    '<span class="cat-monto">' + pesos(f.monto) + '</span>' +
                '</div>' +
                '<div class="cat-barra"><div class="cat-relleno" style="width:' + ancho + '%"></div></div>' +
                '<div class="cat-tipos oculto">' + tiposHtml + '</div>' +
            '</div>';
    });

    contenedor.innerHTML = html;
}

function activarDesplegable(idContenedor) {
    document.getElementById(idContenedor).addEventListener('click', function (evento) {
        const cab = evento.target.closest('.cat-cab');
        if (!cab) {
            return;
        }
        const fila = cab.closest('.cat-fila');
        fila.classList.toggle('abierta');
        const tipos = fila.querySelector('.cat-tipos');
        if (tipos) {
            tipos.classList.toggle('oculto');
        }
    });
}

Chart.defaults.color = '#8997A8';
Chart.defaults.font.family = "'Segoe UI', system-ui, -apple-system, sans-serif";

window.addEventListener('load', function () {
    cargar();
    activarDesplegable('aportePersona');
    activarDesplegable('categorias');
});