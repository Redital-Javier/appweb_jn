const supabaseUrl = 'https://shoxdhweozhoiderszai.supabase.co';
const supabaseKey = 'sb_publishable_0Z63lp6EYq54uUbxCfWQsw_lDXmLaMb';
const cliente = supabase.createClient(supabaseUrl, supabaseKey);

const mesesCorto = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatearMiles(valor) {
    const limpio = valor.replace(/\D/g, '');
    if (limpio === '') {
        return '';
    }
    return Number(limpio).toLocaleString('es-AR');
}

function pesos(n) {
    return '$' + Number(n).toLocaleString('es-AR');
}

function fechaCorta(fecha) {
    const dia = fecha.substring(8, 10);
    const mes = mesesCorto[Number(fecha.substring(5, 7)) - 1];
    return dia + ' ' + mes;
}

function pintarSesion(sesion) {
    const login = document.getElementById('login');
    const carga = document.getElementById('carga');

    if (sesion) {
        login.classList.add('oculto');
        carga.classList.remove('oculto');
        document.getElementById('sesionEmail').textContent = sesion.user.email;
        cargarGastos();
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

async function cargarPagadores() {
    const { data, error } = await cliente
        .from('integrantes')
        .select('id, nombre')
        .order('nombre');

    if (error) {
        console.error(error);
        return;
    }

    const select = document.getElementById('pagador');
    data.forEach(function (integrante) {
        const opcion = document.createElement('option');
        opcion.value = integrante.id;
        opcion.textContent = integrante.nombre;
        select.appendChild(opcion);
    });
}

async function cargarTipos() {
    const { data, error } = await cliente
        .from('tipos_gasto')
        .select('id, nombre, categorias(nombre)')
        .order('categoria_id');

    if (error) {
        console.error(error);
        return;
    }

    const select = document.getElementById('tipo');
    select.innerHTML = '';
    data.forEach(function (tipo) {
        const opcion = document.createElement('option');
        opcion.value = tipo.id;
        opcion.textContent = tipo.nombre + ' — ' + tipo.categorias.nombre;
        select.appendChild(opcion);
    });
}

async function cargarCategorias() {
    const { data, error } = await cliente
        .from('categorias')
        .select('id, nombre')
        .order('nombre');

    if (error) {
        console.error(error);
        return;
    }

    const select = document.getElementById('nuevoTipoCategoria');
    select.innerHTML = '';

    data.forEach(function (categoria) {
        const opcion = document.createElement('option');
        opcion.value = categoria.id;
        opcion.textContent = categoria.nombre;
        select.appendChild(opcion);
    });

    const opcionNueva = document.createElement('option');
    opcionNueva.value = 'nueva';
    opcionNueva.textContent = '+ Nueva categoría';
    select.appendChild(opcionNueva);
}

async function agregarTipo() {
    const nombre = document.getElementById('nuevoTipoNombre').value.trim();
    let categoriaId = document.getElementById('nuevoTipoCategoria').value;

    if (nombre === '') {
        mostrar('Escribí el nombre del tipo.', true);
        return;
    }

    if (categoriaId === 'nueva') {
        const nombreCategoria = document.getElementById('nuevaCategoriaNombre').value.trim();
        if (nombreCategoria === '') {
            mostrar('Escribí el nombre de la categoría.', true);
            return;
        }

        const { data, error } = await cliente
            .from('categorias')
            .insert({ nombre: nombreCategoria })
            .select()
            .single();

        if (error) {
            mostrar('No se pudo crear la categoría.', true);
            console.error(error);
            return;
        }

        categoriaId = data.id;
    }

    const { data: tipoNuevo, error } = await cliente
        .from('tipos_gasto')
        .insert({ nombre: nombre, categoria_id: categoriaId })
        .select()
        .single();

    if (error) {
        mostrar('No se pudo crear el tipo.', true);
        console.error(error);
        return;
    }

    await cargarTipos();
    await cargarCategorias();
    document.getElementById('tipo').value = tipoNuevo.id;

    document.getElementById('nuevoTipoNombre').value = '';
    document.getElementById('nuevaCategoriaNombre').value = '';
    document.getElementById('nuevaCategoriaNombre').classList.add('oculto');
    document.getElementById('nuevoTipo').classList.add('oculto');

    mostrar('Tipo agregado.', false);
}

async function guardarGasto() {
    const pagadorId = document.getElementById('pagador').value;
    const tipoId = document.getElementById('tipo').value;
    const origen = document.getElementById('origen').value;
    const montoTexto = document.getElementById('monto').value.replace(/\./g, '');
    const fecha = document.getElementById('fecha').value;

    if (pagadorId === '' || tipoId === '' || montoTexto === '' || fecha === '') {
        mostrar('Completá todos los campos.', true);
        return;
    }

    const { error } = await cliente
        .from('gastos')
        .insert({
            pagador_id: pagadorId,
            tipo_id: tipoId,
            origen: origen,
            monto: montoTexto,
            fecha: fecha
        });

    if (error) {
        mostrar('No se pudo guardar. Revisá los datos.', true);
        console.error(error);
        return;
    }

    mostrar('Gasto guardado.', false);
    document.getElementById('monto').value = '';
    cargarGastos();
}

function mostrar(texto, esError) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = texto;
    aviso.style.color = esError ? '#F4566B' : '#2FD6C0';
}

async function cargarGastos() {
    const { data, error } = await cliente
        .from('gastos')
        .select('id, monto, fecha, origen, integrantes(nombre), tipos_gasto(nombre)')
        .eq('origen', 'bolsillo')
        .order('fecha', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const contenedor = document.getElementById('listaGastos');

    if (!data || data.length === 0) {
        contenedor.innerHTML = '<div class="vacio">No hay deudas pendientes.</div>';
        return;
    }

    let html = '';
    data.forEach(function (g) {
        html +=
            '<div class="gasto-fila" data-id="' + g.id + '">' +
                '<div class="gasto-fila-top">' +
                    '<div class="gasto-info">' +
                        '<div class="gasto-fila-tipo">' + g.tipos_gasto.nombre + '</div>' +
                        '<div class="gasto-fila-meta">' + g.integrantes.nombre + ' · ' + fechaCorta(g.fecha) + ' · ' + pesos(g.monto) + '</div>' +
                    '</div>' +
                    '<div class="gasto-fila-acc">' +
                        '<button class="saldar-btn">Pagar a ' + g.integrantes.nombre + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="saldar-confirm oculto">' +
                    '<span class="origen-confirm-txt">Pagarle a ' + g.integrantes.nombre + '</span>' +
                    '<button class="origen-si">Confirmar</button>' +
                    '<button class="origen-no">Cancelar</button>' +
                '</div>' +
            '</div>';
    });
    contenedor.innerHTML = html;
}

async function saldarDeuda(id) {
    const { error } = await cliente
        .from('gastos')
        .update({ origen: 'pozo' })
        .eq('id', id);

    if (error) {
        mostrar('No se pudo saldar la deuda.', true);
        console.error(error);
        return;
    }

    mostrar('Pago registrado. El gasto ahora sale del pozo.', false);
    cargarGastos();
}

window.addEventListener('load', async function () {
    cargarPagadores();
    cargarTipos();
    cargarCategorias();

    const { data } = await cliente.auth.getSession();
    pintarSesion(data.session);

    cliente.auth.onAuthStateChange(function (evento, sesion) {
        pintarSesion(sesion);
    });

    document.getElementById('btnLogin').addEventListener('click', iniciarSesion);
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
    document.getElementById('guardar').addEventListener('click', guardarGasto);
    document.getElementById('agregarTipo').addEventListener('click', agregarTipo);

    document.getElementById('mostrarNuevoTipo').addEventListener('click', function () {
        document.getElementById('nuevoTipo').classList.toggle('oculto');
    });

    document.getElementById('nuevoTipoCategoria').addEventListener('change', function (evento) {
        const inputNueva = document.getElementById('nuevaCategoriaNombre');
        if (evento.target.value === 'nueva') {
            inputNueva.classList.remove('oculto');
        } else {
            inputNueva.classList.add('oculto');
        }
    });

    document.getElementById('monto').addEventListener('input', function (evento) {
        evento.target.value = formatearMiles(evento.target.value);
    });

    document.getElementById('listaGastos').addEventListener('click', function (evento) {
        const fila = evento.target.closest('.gasto-fila');
        if (!fila) {
            return;
        }

        if (evento.target.closest('.saldar-btn')) {
            fila.querySelector('.gasto-fila-acc').classList.add('oculto');
            fila.querySelector('.saldar-confirm').classList.remove('oculto');
            return;
        }

        if (evento.target.closest('.origen-si')) {
            saldarDeuda(fila.dataset.id);
            return;
        }

        if (evento.target.closest('.origen-no')) {
            fila.querySelector('.saldar-confirm').classList.add('oculto');
            fila.querySelector('.gasto-fila-acc').classList.remove('oculto');
            return;
        }
    });
});