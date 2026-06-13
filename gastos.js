const supabaseUrl = 'https://shoxdhweozhoiderszai.supabase.co';
const supabaseKey = 'sb_publishable_0Z63lp6EYq54uUbxCfWQsw_lDXmLaMb';
const cliente = supabase.createClient(supabaseUrl, supabaseKey);

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
            monto: montoTexto,
            fecha: fecha
        });

    if (error) {
        mostrar('No se pudo guardar. Revisá los datos.', true);
        console.error(error);
        return;
    }

    mostrar('Gasto guardado.', false);
}

function mostrar(texto, esError) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = texto;
    aviso.style.color = esError ? '#F4566B' : '#2FD6C0';
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
});