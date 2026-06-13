const supabaseUrl = 'https://shoxdhweozhoiderszai.supabase.co';
const supabaseKey = 'sb_publishable_0Z63lp6EYq54uUbxCfWQsw_lDXmLaMb';
const cliente = supabase.createClient(supabaseUrl, supabaseKey);

const mesesCorto = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const mesesLargo = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

let resumenData = [];
let aportesData = [];
let gastosData = [];
let clavesMes = [];

let metrica = 'aportado';
let filtroActual = '';

function pesos(n) {
    const negativo = n < 0;
    return (negativo ? '-' : '') + '$' + Math.abs(n).toLocaleString('es-AR');
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

function aporteMesDe(id, claveMes) {
    let suma = 0;
    aportesData.forEach(function (a) {
        if (a.integrante_id === id && a.periodo.substring(0, 7) === claveMes) {
            suma += Number(a.monto);
        }
    });
    return suma;
}

function gastoMesDe(id, claveMes) {
    let suma = 0;
    gastosData.forEach(function (g) {
        if (g.pagador_id === id && g.fecha.substring(0, 7) === claveMes) {
            suma += Number(g.monto);
        }
    });
    return suma;
}

function aportadoDe(id) {
    let suma = 0;
    aportesData.forEach(function (a) {
        if (a.integrante_id === id) {
            suma += Number(a.monto);
        }
    });
    return suma;
}

function gastadoDe(id) {
    let suma = 0;
    gastosData.forEach(function (g) {
        if (g.pagador_id === id) {
            suma += Number(g.monto);
        }
    });
    return suma;
}

function valorMes(id, claveMes) {
    if (metrica === 'aportado') {
        return aporteMesDe(id, claveMes);
    }
    if (metrica === 'gastado') {
        return gastoMesDe(id, claveMes);
    }
    return aporteMesDe(id, claveMes) + gastoMesDe(id, claveMes);
}

function totalMetrica(id) {
    if (metrica === 'aportado') {
        return aportadoDe(id);
    }
    if (metrica === 'gastado') {
        return gastadoDe(id);
    }
    return aportadoDe(id) + gastadoDe(id);
}

function aportesDe(id) {
    return aportesData
        .filter(function (a) { return a.integrante_id === id; })
        .sort(function (a, b) { return b.periodo.localeCompare(a.periodo); });
}

function gastosDe(id) {
    return gastosData.filter(function (g) { return g.pagador_id === id; });
}

function tieneDetalle(id) {
    if (metrica === 'aportado') {
        return aportesDe(id).length > 0;
    }
    if (metrica === 'gastado') {
        return gastosDe(id).length > 0;
    }
    return aportesDe(id).length > 0 || gastosDe(id).length > 0;
}

function bloqueAportes(id) {
    const aps = aportesDe(id);
    let lista = '';
    if (aps.length === 0) {
        lista = '<div class="sin-gastos">Sin aportes.</div>';
    } else {
        aps.forEach(function (a) {
            lista +=
                '<div class="gasto">' +
                    '<div><div class="gasto-tipo">' + mesLargo(a.periodo) + '</div></div>' +
                    '<div class="gasto-monto">' + pesos(a.monto) + '</div>' +
                '</div>';
        });
    }
    return '<div class="bloque-detalle aportes">' +
            '<div class="detalle-titulo">Aportes · ' + pesos(aportadoDe(id)) + '</div>' + lista +
        '</div>';
}

function bloqueGastos(id) {
    const gs = gastosDe(id);
    let lista = '';
    if (gs.length === 0) {
        lista = '<div class="sin-gastos">Sin gastos.</div>';
    } else {
        gs.forEach(function (g) {
            lista +=
                '<div class="gasto">' +
                    '<div>' +
                        '<div class="gasto-tipo">' + g.tipos_gasto.nombre + '</div>' +
                        '<div class="gasto-meta">' + g.tipos_gasto.categorias.nombre + ' · ' + g.fecha + '</div>' +
                    '</div>' +
                    '<div class="gasto-monto">' + pesos(g.monto) + '</div>' +
                '</div>';
        });
    }
    return '<div class="bloque-detalle gastos">' +
            '<div class="detalle-titulo">Gastos · ' + pesos(gastadoDe(id)) + '</div>' + lista +
        '</div>';
}

function detalleHtml(id) {
    if (metrica === 'aportado') {
        return '<div class="detalle-persona">' + bloqueAportes(id) + '</div>';
    }
    if (metrica === 'gastado') {
        return '<div class="detalle-persona">' + bloqueGastos(id) + '</div>';
    }

    const total = aportadoDe(id) + gastadoDe(id);
    return '<div class="detalle-persona">' +
            bloqueAportes(id) +
            bloqueGastos(id) +
            '<div class="total-detalle">' +
                '<span class="total-detalle-lbl">Total <span class="sub">(aportado + gastado)</span></span>' +
                '<span class="total-detalle-val">' + pesos(total) + '</span>' +
            '</div>' +
        '</div>';
}

function pintarColorSelector() {
    const selector = document.querySelector('.selector');
    selector.classList.remove('metrica-aportado', 'metrica-gastado', 'metrica-total');
    selector.classList.add('metrica-' + metrica);
}

async function cargar() {
    const { data: resumen, error: errorResumen } = await cliente
        .from('resumen_personas')
        .select('id, nombre')
        .order('nombre');

    if (errorResumen) {
        console.error(errorResumen);
        return;
    }

    const { data: aportes, error: errorAportes } = await cliente
        .from('aportes')
        .select('integrante_id, monto, periodo');

    if (errorAportes) {
        console.error(errorAportes);
        return;
    }

    const { data: gastos, error: errorGastos } = await cliente
        .from('gastos')
        .select('pagador_id, monto, fecha, tipos_gasto(nombre, categorias(nombre))')
        .order('fecha', { ascending: false });

    if (errorGastos) {
        console.error(errorGastos);
        return;
    }

    resumenData = resumen;
    aportesData = aportes;
    gastosData = gastos;

    const set = {};
    aportes.forEach(function (a) {
        set[a.periodo.substring(0, 7)] = true;
    });
    gastos.forEach(function (g) {
        set[g.fecha.substring(0, 7)] = true;
    });
    clavesMes = Object.keys(set).sort();

    const select = document.getElementById('persona');

    const todos = document.createElement('option');
    todos.value = '';
    todos.textContent = 'Todos los integrantes';
    select.appendChild(todos);

    resumen.forEach(function (persona) {
        const opcion = document.createElement('option');
        opcion.value = persona.id;
        opcion.textContent = persona.nombre;
        select.appendChild(opcion);
    });

    select.addEventListener('change', function () {
        filtroActual = select.value;
        render();
    });

    document.getElementById('contenido').addEventListener('click', function (evento) {
        const boton = evento.target.closest('.metrica');
        if (boton) {
            metrica = boton.dataset.m;
            render();
            return;
        }

        const fila = evento.target.closest('tr.fila-persona.tiene-gastos');
        if (!fila) {
            return;
        }
        fila.classList.toggle('abierta');
        const detalle = fila.nextElementSibling;
        if (detalle && detalle.classList.contains('detalle-fila')) {
            detalle.classList.toggle('oculto');
        }
    });

    render();
}

function render() {
    const contenedor = document.getElementById('contenido');

    pintarColorSelector();

    let html =
        '<div class="metricas">' +
            '<button class="metrica aportado' + (metrica === 'aportado' ? ' activa' : '') + '" data-m="aportado">Aportado</button>' +
            '<button class="metrica gastado' + (metrica === 'gastado' ? ' activa' : '') + '" data-m="gastado">Gastado</button>' +
            '<button class="metrica total' + (metrica === 'total' ? ' activa' : '') + '" data-m="total">Total</button>' +
        '</div>';

    let aportadoBase, gastadoBase;
    if (filtroActual === '') {
        aportadoBase = 0;
        aportesData.forEach(function (a) { aportadoBase += Number(a.monto); });
        gastadoBase = 0;
        gastosData.forEach(function (g) { gastadoBase += Number(g.monto); });
    } else {
        const idSel = Number(filtroActual);
        aportadoBase = aportadoDe(idSel);
        gastadoBase = gastadoDe(idSel);
    }

    let lblCaja, valCaja, estiloVal;
    if (metrica === 'aportado') {
        lblCaja = 'Total aportado';
        valCaja = aportadoBase;
        estiloVal = 'color: var(--cyan); text-shadow: 0 0 16px rgba(47, 214, 192, 0.4);';
    } else if (metrica === 'gastado') {
        lblCaja = 'Total gastado';
        valCaja = gastadoBase;
        estiloVal = 'color: var(--rojo); text-shadow: 0 0 16px rgba(244, 86, 107, 0.4);';
    } else {
        lblCaja = 'Total';
        valCaja = aportadoBase + gastadoBase;
        estiloVal = 'color: var(--naranja); text-shadow: 0 0 16px rgba(240, 150, 74, 0.4);';
    }

    html +=
        '<div class="total-caja">' +
            '<div class="total-caja-lbl">' + lblCaja + '</div>' +
            '<div class="total-caja-val" style="' + estiloVal + '">' + pesos(valCaja) + '</div>' +
        '</div>';

    if (clavesMes.length === 0) {
        html += '<div class="vacio">Todavía no hay movimientos cargados.</div>';
        contenedor.innerHTML = html;
        return;
    }

    const filas = filtroActual === ''
        ? resumenData
        : resumenData.filter(function (p) { return p.id === Number(filtroActual); });

    const colspan = clavesMes.length + 2;

    let thead = '<tr><th>Integrante</th>';
    clavesMes.forEach(function (c) {
        thead += '<th class="num">' + rotuloMes(c) + '</th>';
    });
    thead += '<th class="num tot">Total</th></tr>';

    let tbody = '';
    filas.forEach(function (p) {
        const desplegable = tieneDetalle(p.id);
        const claseFila = 'fila-persona' + (desplegable ? ' tiene-gastos' : '');
        const flecha = '<span class="flecha' + (desplegable ? '' : ' invisible') + '"></span>';

        let fila = '<tr class="' + claseFila + '"><td class="nom">' + flecha + p.nombre + '</td>';
        clavesMes.forEach(function (c) {
            const v = valorMes(p.id, c);
            fila += v > 0
                ? '<td class="num">' + pesos(v) + '</td>'
                : '<td class="num tenue">—</td>';
        });
        fila += '<td class="num tot">' + pesos(totalMetrica(p.id)) + '</td></tr>';

        if (desplegable) {
            fila += '<tr class="detalle-fila oculto"><td colspan="' + colspan + '">' + detalleHtml(p.id) + '</td></tr>';
        }

        tbody += fila;
    });

    if (filtroActual === '') {
        let totalGeneralMetrica = 0;
        resumenData.forEach(function (p) {
            totalGeneralMetrica += totalMetrica(p.id);
        });

        let filaTotal = '<tr class="fila-total"><td><span class="flecha invisible"></span>Total</td>';
        clavesMes.forEach(function (c) {
            let suma = 0;
            resumenData.forEach(function (p) {
                suma += valorMes(p.id, c);
            });
            filaTotal += '<td class="num">' + pesos(suma) + '</td>';
        });
        filaTotal += '<td class="num tot">' + pesos(totalGeneralMetrica) + '</td></tr>';
        tbody += filaTotal;
    }

    html +=
        '<div class="tabla-wrap">' +
            '<table class="tabla-aportes metrica-' + metrica + '">' +
                '<thead>' + thead + '</thead>' +
                '<tbody>' + tbody + '</tbody>' +
            '</table>' +
        '</div>';

    contenedor.innerHTML = html;
}

window.addEventListener('load', cargar);