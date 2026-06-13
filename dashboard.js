const supabaseUrl = 'https://shoxdhweozhoiderszai.supabase.co';
const supabaseKey = 'sb_publishable_0Z63lp6EYq54uUbxCfWQsw_lDXmLaMb';
const cliente = supabase.createClient(supabaseUrl, supabaseKey);

const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

let listaAldia = [];
let listaAtrasados = [];
let cuotaAbierta = null;

function pesos(n) {
    const negativo = n < 0;
    return (negativo ? '-' : '') + '$' + Math.abs(n).toLocaleString('es-AR');
}

function mesLargo(fecha) {
    const nombreMes = meses[Number(fecha.substring(5, 7)) - 1];
    const anio = fecha.substring(0, 4);
    return nombreMes + ' ' + anio;
}

async function cargar() {
    const { data: resumen, error: e1 } = await cliente
        .from('resumen_personas')
        .select('id, nombre, aportado, gastado')
        .order('nombre');
    if (e1) { console.error(e1); return; }

    const { data: gastos, error: e2 } = await cliente
        .from('gastos')
        .select('monto, tipos_gasto(nombre, categorias(nombre))');
    if (e2) { console.error(e2); return; }

    const { data: aportes, error: e3 } = await cliente
        .from('aportes')
        .select('integrante_id, monto, periodo');
    if (e3) { console.error(e3); return; }

    dibujarKpis(resumen);
    dibujarCategorias(gastos);
    dibujarCuotas(resumen, aportes);
}

function dibujarKpis(resumen) {
    let totalAportado = 0;
    let totalGastado = 0;
    resumen.forEach(function (r) {
        totalAportado += Number(r.aportado);
        totalGastado += Number(r.gastado);
    });
    const saldo = totalAportado - totalGastado;

    document.getElementById('aportado').textContent = pesos(totalAportado);
    document.getElementById('gastado').textContent = pesos(totalGastado);
    const elSaldo = document.getElementById('saldo');
    elSaldo.textContent = pesos(saldo);
    elSaldo.classList.toggle('negativo', saldo < 0);
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

function dibujarCuotas(resumen, aportes) {
    const mesesConMovimiento = {};
    aportes.forEach(function (a) {
        mesesConMovimiento[a.periodo.substring(0, 7)] = true;
    });
    const totalMeses = Object.keys(mesesConMovimiento).length;

    listaAldia = [];
    listaAtrasados = [];

    resumen.forEach(function (persona) {
        const susAportes = aportes.filter(function (a) {
            return a.integrante_id === persona.id;
        });

        const susMeses = {};
        let ultimo = null;
        susAportes.forEach(function (a) {
            susMeses[a.periodo.substring(0, 7)] = true;
            if (ultimo === null || a.periodo > ultimo.periodo) {
                ultimo = a;
            }
        });
        const cantMeses = Object.keys(susMeses).length;

        const fila = {
            nombre: persona.nombre,
            mes: ultimo ? mesLargo(ultimo.periodo) : '—',
            importe: ultimo ? pesos(ultimo.monto) : '—'
        };

        if (totalMeses > 0 && cantMeses === totalMeses) {
            listaAldia.push(fila);
        } else {
            listaAtrasados.push(fila);
        }
    });

    const alDia = listaAldia.length;
    const atrasados = listaAtrasados.length;
    const total = alDia + atrasados;
    const pctAldia = total > 0 ? (alDia / total) * 100 : 0;

    document.getElementById('cuotasAldia').textContent = alDia;
    document.getElementById('cuotasAtrasado').textContent = atrasados;
    document.getElementById('barraAldia').style.width = pctAldia + '%';
    document.getElementById('barraAtrasado').style.width = (100 - pctAldia) + '%';

    if (cuotaAbierta !== null) {
        pintarDetalle(cuotaAbierta);
    }
}

function tablaCuotas(lista, vacioTexto) {
    if (lista.length === 0) {
        return '<div class="vacio">' + vacioTexto + '</div>';
    }

    let filas = '';
    lista.forEach(function (p) {
        const claseMes = p.mes === '—' ? ' class="tenue"' : '';
        filas +=
            '<tr>' +
                '<td class="nom">' + p.nombre + '</td>' +
                '<td' + claseMes + '>' + p.mes + '</td>' +
                '<td class="num">' + p.importe + '</td>' +
            '</tr>';
    });

    return '<table class="tabla-cuotas">' +
            '<thead><tr>' +
                '<th>Persona</th>' +
                '<th>Último aporte</th>' +
                '<th class="num">Importe</th>' +
            '</tr></thead>' +
            '<tbody>' + filas + '</tbody>' +
        '</table>';
}

function pintarDetalle(cual) {
    const contenedor = document.getElementById('detalleCuotas');
    if (cual === 'aldia') {
        contenedor.innerHTML = tablaCuotas(listaAldia, 'Nadie aportó todos los meses todavía.');
    } else {
        contenedor.innerHTML = tablaCuotas(listaAtrasados, 'No hay atrasados.');
    }
}

function toggleDetalle(cual) {
    const cardAldia = document.getElementById('cardAldia');
    const cardAtrasado = document.getElementById('cardAtrasado');
    const contenedor = document.getElementById('detalleCuotas');

    if (cuotaAbierta === cual) {
        cuotaAbierta = null;
        contenedor.innerHTML = '';
        cardAldia.classList.remove('activa');
        cardAtrasado.classList.remove('activa');
        return;
    }

    cuotaAbierta = cual;
    cardAldia.classList.toggle('activa', cual === 'aldia');
    cardAtrasado.classList.toggle('activa', cual === 'atrasado');
    pintarDetalle(cual);
}

window.addEventListener('load', function () {
    cargar();

    document.getElementById('cardAldia').addEventListener('click', function () {
        toggleDetalle('aldia');
    });
    document.getElementById('cardAtrasado').addEventListener('click', function () {
        toggleDetalle('atrasado');
    });

    document.getElementById('categorias').addEventListener('click', function (evento) {
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
});