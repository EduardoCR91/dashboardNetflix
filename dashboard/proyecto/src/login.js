import { supabase } from "./supabase.js"; // Asegúrate de tener este archivo
import { mostrarRegistro } from "./registro.js";

export function mostrarLogin() {
document.querySelector("#app").innerHTML =`
<div>
<h2>Login</h2>
<form id="login-form">
<input type="email" id="email" placeholder="Email" required />
<input type="password" id="password" placeholder="Contraseña" required
/>
<button type="submit">Iniciar sesión</button>
</form>
<h2>No tiene cuenta</h2>
<button id="btn-registro">Regístrese</button>
</div>
`;
document.querySelector("#login-form").addEventListener("submit"
,
handleLogin);
document.querySelector("#btn-registro").addEventListener("click",mostrarRegistro);

document.getElementById('btn-registro').addEventListener('click', ()=> {
mostrarRegistro();
});

}



async function handleLogin(event) {
event.preventDefault();
const email = document.querySelector("#email").value;
const password = document.querySelector("#password").value;
const { data, error } = await supabase.auth.signInWithPassword({ email,
password });
if (error) {
alert("Error al iniciar sesión: " + error.message);
return;
}
console.log("Login exitoso", data.user);
location.reload();
}