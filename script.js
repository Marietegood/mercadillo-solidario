const URL_GOOGLE_SHEET = "https://script.google.com/macros/s/AKfycbxGk9_boskjnlz9bnu_2ocjZWzgkm9vYKCngFp9MNccFAzOjqvNJ4kaf5gBk48iv2Vc/exec"; 

// Cargar carrito del almacenamiento local
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// FUNCIÓN PARA AÑADIR (Con la alerta que pediste)
function añadirAlCarrito(nombreProducto, precio) {
    const precioNum = parseFloat(precio);
    const itemExistente = carrito.find(item => item.nombre === nombreProducto);

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({ nombre: nombreProducto, precio: precioNum, cantidad: 1 });
    }
    
    guardarYActualizar();
    
    // ALERTA POR PRODUCTO AÑADIDO
    alert("✅ ¡" + nombreProducto + " añadido al carrito!");
}

function cambiarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    guardarYActualizar();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarYActualizar();
}

function vaciarCarrito() {
    if(confirm("¿Quieres vaciar todo el carrito?")) {
        carrito = [];
        guardarYActualizar();
    }
}

function guardarYActualizar() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    cargarCarrito();
}

// DIBUJAR EL CARRITO (Corrigiendo el diseño de la foto)
function cargarCarrito() {
    const lista = document.getElementById('lista-carrito');
    if (!lista) return;

    lista.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        lista.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">El carrito está vacío</p>';
        const totalTxt = document.getElementById('total-pagar-texto');
        if(totalTxt) totalTxt.innerText = "0€";
        return;
    }

    carrito.forEach((producto, index) => {
        const cant = producto.cantidad || 1;
        const prec = producto.precio || 0;
        const subtotal = prec * cant;
        total += subtotal;

        const div = document.createElement('div');
        div.style = "display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 8px;";

        div.innerHTML = `
            <div style="flex: 2;">
                <span style="font-weight: bold; font-size: 1rem; color: #333;">${producto.nombre}</span><br>
                <small style="color: #888;">${prec}€ unidad</small>
            </div>
            
            <div style="flex: 3; display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                <button onclick="cambiarCantidad(${index}, -1)" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #ff4d4d; background: white; color: #ff4d4d; cursor: pointer; font-weight: bold;">-</button>
                
                <span style="font-weight: bold; min-width: 20px; text-align: center;">${cant}</span>
                
                <button onclick="cambiarCantidad(${index}, 1)" style="width: 28px; height: 28px; border-radius: 50%; border: none; background: #2ecc71; color: white; cursor: pointer; font-weight: bold;">+</button>
                
                <span style="margin-left: 10px; font-weight: bold; min-width: 50px; text-align: right;">${subtotal}€</span>
                
                <button onclick="eliminarDelCarrito(${index})" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 1.2rem; margin-left: 5px;">✕</button>
            </div>
        `;
        lista.appendChild(div);
    });

    const totalTxt = document.getElementById('total-pagar-texto');
    if(totalTxt) totalTxt.innerText = total + "€";
}

// ENVIAR A GOOGLE (Con limpieza de formulario)
function guardarSeleccion(event) {
    event.preventDefault();

    // 1. Capturamos los elementos de nuevo para asegurar que leemos el estado actual
    const check = document.getElementById('check-email');
    const inputEmail = document.getElementById('email');
    const btnEnviar = event.target.querySelector('button[type="submit"]');

    // 2. Verificamos el valor: si está marcado, usamos el valor del input. Si no, "No solicitado".
    let emailFinal = "No solicitado";
    if (check && check.checked) {
        emailFinal = inputEmail.value;
    }

    if (carrito.length === 0) return alert("El carrito está vacío, tete.");

    // Preparar el resto de datos
    const nombre = document.getElementById('nombre').value;
    const apellidos = document.getElementById('apellidos').value;
    
    let totalVenta = 0;
    const productosTexto = carrito.map(item => {
        totalVenta += (item.precio * item.cantidad);
        return `${item.nombre} (x${item.cantidad})`;
    }).join(', ');

    const datosFormulario = new URLSearchParams();
    datosFormulario.append("nombre", nombre);
    datosFormulario.append("apellidos", apellidos);
    datosFormulario.append("email", emailFinal); // Enviamos el valor verificado
    datosFormulario.append("productos", productosTexto);
    datosFormulario.append("total", totalVenta);

    btnEnviar.innerText = "Enviando...";
    btnEnviar.disabled = true;

    fetch(URL_GOOGLE_SHEET, {
        method: "POST",
        mode: "no-cors",
        body: datosFormulario
    })
    .then(() => {
        // CORRECCIÓN DEL MENSAJE DE ALERTA
        if (emailFinal !== "No solicitado") {
            alert("✅ ¡Pedido enviado!\nTe llegará un correo de confirmación a: " + emailFinal);
        } else {
            alert("✅ ¡Pedido enviado con éxito!");
        }
        
        localStorage.removeItem('carrito');
        carrito = [];
        cargarCarrito();
        event.target.reset();
        document.getElementById('contenedor-email').style.display = 'none';
        btnEnviar.innerText = "GUARDAR SELECCIÓN";
        btnEnviar.disabled = false;
    });
}

function toggleEmail() {
    const checkbox = document.getElementById('check-email');
    const contenedor = document.getElementById('contenedor-email');
    const inputEmail = document.getElementById('email');

    // Verificación de seguridad
    if (!checkbox || !contenedor) {
        console.error("No se encuentran los elementos del email, tete");
        return;
    }

    if (checkbox.checked) {
        contenedor.style.display = 'block';
        inputEmail.required = true;
        inputEmail.focus(); // Pone el cursor directo para escribir
    } else {
        contenedor.style.display = 'none';
        inputEmail.required = false;
        inputEmail.value = ''; // Limpia el texto si lo desmarcan
    }
}

// --- FUNCIÓN PARA FILTRAR ORDENADORES ---
function filtrarPCs(tipo, botonPulsado) {
    // 1. Apaga los botones SOLO de este menú y enciende el pulsado
    let botonesMenu = botonPulsado.parentElement.querySelectorAll('.btn-filtro');
    botonesMenu.forEach(btn => btn.classList.remove('activo'));
    botonPulsado.classList.add('activo');

    // 2. Filtra las tarjetas de los PCs
    let todosLosPCs = document.querySelectorAll('#grid-pcs .tarjeta');
    todosLosPCs.forEach(pc => {
        if (tipo === 'todos') {
            pc.classList.remove('oculto');
        } else if (tipo === 'sobremesa') {
            pc.classList.contains('pc-sobremesa') ? pc.classList.remove('oculto') : pc.classList.add('oculto');
        } else if (tipo === 'portatil') {
            pc.classList.contains('pc-portatil') ? pc.classList.remove('oculto') : pc.classList.add('oculto');
        }
    });
}

// --- FUNCIÓN PARA FILTRAR CABLES Y ADAPTADORES ---
function filtrarCables(tipo, botonPulsado) {
    // 1. Apaga los botones SOLO de este menú y enciende el pulsado
    let botonesMenu = botonPulsado.parentElement.querySelectorAll('.btn-filtro');
    botonesMenu.forEach(btn => btn.classList.remove('activo'));
    botonPulsado.classList.add('activo');

    // 2. Filtra las tarjetas de los cables
    let todosLosCables = document.querySelectorAll('#grid-cableado .tarjeta');
    todosLosCables.forEach(item => {
        if (tipo === 'todos') {
            item.classList.remove('oculto');
        } else if (tipo === 'cable') {
            item.classList.contains('item-cable') ? item.classList.remove('oculto') : item.classList.add('oculto');
        } else if (tipo === 'adaptador') {
            item.classList.contains('item-adaptador') ? item.classList.remove('oculto') : item.classList.add('oculto');
        }
    });

    // --- MENÚ HAMBURGUESA PARA VERSIÓN APP (MÓVIL) ---
    function toggleMenu() {
    var menu = document.getElementById("menu-principal");
    menu.classList.toggle("menu-activo");
    }

    
}
window.onload = cargarCarrito;