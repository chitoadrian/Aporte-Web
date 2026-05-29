// ==========================================
// 1. CONEXIÓN ÚNICA CON SUPABASE
// ==========================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = "https://qvnbvfwcodjtqhbczxar.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable__qQmLTITfpuVePH67M2dCw_CF8kmosN";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. LÓGICA DE LA CALCULADORA Y BOTONES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Captura de elementos del DOM para Ari Manager
    const btnCalcular = document.getElementById('btn-calcular') || document.getElementById('btnCalcular');
    const formPresupuesto = document.getElementById('form-presupuesto') || document.getElementById('formPresupuesto');
    
    // Inputs del formulario
    const inputCliente = document.getElementById('cliente');
    const inputDispositivo = document.getElementById('dispositivo');
    const inputRepuestos = document.getElementById('repuestos');
    const inputManoObra = document.getElementById('mano_obra') || document.getElementById('manoObra');
    const inputEmail = document.getElementById('email');

    // Conectar el evento para Guardar de una
    if (formPresupuesto) {
        formPresupuesto.addEventListener('submit', guardarDatos);
    } else if (btnCalcular) {
        btnCalcular.addEventListener('click', guardarDatos);
    }

    async function guardarDatos(e) {
        if (e) e.preventDefault();

        // Obtener valores de las casillas
        const cliente = inputCliente ? inputCliente.value : '';
        const dispositivo = inputDispositivo ? inputDispositivo.value : '';
        const repuestos = inputRepuestos ? parseFloat(inputRepuestos.value) || 0 : 0;
        const manoObra = inputManoObra ? parseFloat(inputManoObra.value) || 0 : 0;
        const email = inputEmail ? inputEmail.value : 'sin-email@correo.com';

        // Cálculos (IVA 15% y Total)
        const subtotal = repuestos + manoObra;
        const iva = subtotal * 0.15;
        const total = subtotal + iva;

        if (!cliente || !dispositivo) {
            alert("Por favor, llena los campos principales (Cliente y Dispositivo).");
            return;
        }

        try {
            // Mandar directo a Supabase
            const { data, error } = await supabase
                .from('presupuestos')
                .insert([
                    { 
                        cliente: cliente, 
                        dispositivo: dispositivo, 
                        repuestos: repuestos, 
                        mano_obra: manoObra, 
                        iva: iva, 
                        total: total,
                        email: email
                    }
                ]);

            if (error) throw error;

            alert("¡Presupuesto guardado con éxito en la nube de Supabase!");
            if (formPresupuesto) formPresupuesto.reset();
            
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error de conexión: " + error.message);
        }
    }
});