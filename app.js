const supabaseUrl = 'https://shoxdhweozhoiderszai.supabase.co';
const supabaseKey = 'sb_publishable_0Z63lp6EYq54uUbxCfWQsw_lDXmLaMb';
const cliente = supabase.createClient(supabaseUrl, supabaseKey);

const mesesLargo = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatearMiles(valor) {
    const limpio = valor.replace(/\D/g, '');
    if (limpio === '') {
        return '';
    }
    return Number(limpio).toLocaleString('es-AR');
}

function pintarSesion(sesion) {
    const login = document.getElementById('login');
    const carga = document.getElementById('carga');

    if (sesion) {
        login.classList.add('oculto');
        carga.classList.remove('oculto');
        document.getElementById('sesionEmail').textContent = sesion.user.email;
    } else {
        carga.classList.add('oculto');
        login.classList.remove('oculto');
    }
}

async function iniciarSesion() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (email === '' || password === '') {
        mostrarLogin('Completá email y contraseña.', true);
        return;
    }

    const { error } = await cliente.auth.signInWithPassword({ email, password });

    if (error) {
        mostrarLogin('No se pudo iniciar sesión. Revisá los datos.', true);
        console.error(error);
        return;
    }

    mostrarLogin('', false);
}

async function cerrarSesion() {
    await cliente.auth.signOut();
}

function mostrarLogin(texto, esError) {
    const aviso = document.getElementById('avisoLogin');
    aviso.textContent = texto;
    aviso.style.color = esError ? '#F4566B' : '#2FD6C0';
}

async function cargarIntegrantes() {
    const { data, error } = await cliente
        .from('integrantes')
        .select('id, nombre')
        .order('nombre');

    if (error) {
        console.error(error);
        return;
    }

    const select = document.getElementById('integrante');
    data.forEach(function (integrante) {
        const opcion = document.createElement('option');
        opcion.value = integrante.id;
        opcion.textContent = integrante.nombre;
        select.appendChild(opcion);
    });
}

async function guardarAporte() {
    const integranteId = document.getElementById('integrante').value;
    const montoTexto = document.getElementById('monto').value.replace(/\./g, '');
    const fecha = document.getElementById('fecha').value;

    if (integranteId === '' || montoTexto === '' || fecha === '') {
        mostrar('Completá todos los campos.', true);
        return;
    }

    const { error } = await cliente
        .from('aportes')
        .insert({
            integrante_id: integranteId,
            monto: montoTexto,
            periodo: fecha
        });

    if (error) {
        mostrar('No se pudo guardar. Revisá los datos.', true);
        console.error(error);
        return;
    }

    mostrar('Aporte guardado.', false);
}

function mostrar(texto, esError) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = texto;
    aviso.style.color = esError ? '#F4566B' : '#2FD6C0';
}

function mesLargoCuota(fecha) {
    const mes = Number(fecha.substring(5, 7));
    const anio = fecha.substring(0, 4);
    const nombre = mesesLargo[mes - 1];
    return nombre.charAt(0).toUpperCase() + nombre.slice(1) + ' ' + anio;
}

function pesosCuota(n) {
    return '$' + Number(n).toLocaleString('es-AR');
}

async function cargarCuotas() {
    const { data, error } = await cliente
        .from('cuotas')
        .select('periodo, monto_por_persona')
        .order('periodo', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const contenedor = document.getElementById('listaCuotas');

    if (!data || data.length === 0) {
        contenedor.innerHTML = '<div class="vacio">Todavía no cargaste ninguna cuota.</div>';
        return;
    }

    let html = '<div class="cuota-lista">';
    data.forEach(function (c) {
        html +=
            '<div class="cuota-item" data-mes="' + c.periodo.substring(0, 7) + '" data-monto="' + c.monto_por_persona + '">' +
                '<span class="cuota-item-mes">' + mesLargoCuota(c.periodo) + '</span>' +
                '<span class="cuota-item-monto">' + pesosCuota(c.monto_por_persona) + '</span>' +
            '</div>';
    });
    html += '</div>';
    contenedor.innerHTML = html;
}

async function guardarCuota() {
    const mes = document.getElementById('cuotaMes').value;
    const montoTexto = document.getElementById('cuotaMonto').value.replace(/\./g, '');

    if (mes === '' || montoTexto === '') {
        mostrarCuota('Completá el mes y el monto.', true);
        return;
    }

    const periodo = mes + '-01';

    const { error } = await cliente
        .from('cuotas')
        .upsert({ periodo: periodo, monto_por_persona: montoTexto }, { onConflict: 'periodo' });

    if (error) {
        mostrarCuota('No se pudo guardar la cuota.', true);
        console.error(error);
        return;
    }

    mostrarCuota('Cuota guardada.', false);
    document.getElementById('cuotaMonto').value = '';
    cargarCuotas();
}

function mostrarCuota(texto, esError) {
    const aviso = document.getElementById('avisoCuota');
    aviso.textContent = texto;
    aviso.style.color = esError ? '#F4566B' : '#2FD6C0';
}

window.addEventListener('load', async function () {
    cargarIntegrantes();
    cargarCuotas();

    const { data } = await cliente.auth.getSession();
    pintarSesion(data.session);

    cliente.auth.onAuthStateChange(function (evento, sesion) {
        pintarSesion(sesion);
    });

    document.getElementById('btnLogin').addEventListener('click', iniciarSesion);
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
    document.getElementById('guardar').addEventListener('click', guardarAporte);
    document.getElementById('guardarCuota').addEventListener('click', guardarCuota);

    document.getElementById('monto').addEventListener('input', function (evento) {
        evento.target.value = formatearMiles(evento.target.value);
    });

    document.getElementById('cuotaMonto').addEventListener('input', function (evento) {
        evento.target.value = formatearMiles(evento.target.value);
    });

    document.getElementById('listaCuotas').addEventListener('click', function (evento) {
        const item = evento.target.closest('.cuota-item');
        if (!item) {
            return;
        }
        document.getElementById('cuotaMes').value = item.dataset.mes;
        document.getElementById('cuotaMonto').value = formatearMiles(item.dataset.monto);
    });
});