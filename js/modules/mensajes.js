// js/modules/mensajes.js
import * as state from './state.js';
import { showToast } from './utils.js';

export function showMessageModal() {
    document.getElementById('messageModal').style.display = 'flex';
    loadTherapistsForMessage();
    setRating(5);
}

export function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
    document.getElementById('messageName').value = '';
    document.getElementById('messageEmail').value = '';
    document.getElementById('messageWhatsapp').value = '';
    document.getElementById('messageText').value = '';
}

function loadTherapistsForMessage() {
    const select = document.getElementById('messageTherapist');
    if (!select) return;
    select.innerHTML = '<option value="">Mensaje general para todos</option>';
    const publicStaff = state.staff.filter(s => s.spec && s.spec.length > 0 && !s.isHiddenAdmin);
    publicStaff.forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.name}</option>`;
    });
}

export function setRating(rating) {
    state.setCurrentRating(rating);
    document.getElementById('messageRating').value = rating;
    for (let i = 1; i <= 5; i++) {
        const star = document.getElementById(`star${i}`);
        if (star) {
            star.textContent = i <= rating ? '★' : '☆';
        }
    }
}

export function saveMessage() {
    const name = document.getElementById('messageName').value;
    const email = document.getElementById('messageEmail').value;
    const whatsapp = document.getElementById('messageWhatsapp').value;
    const therapistId = document.getElementById('messageTherapist').value;
    const rating = document.getElementById('messageRating').value;
    const text = document.getElementById('messageText').value;

    if (!name || !text) {
        showToast('Nombre y mensaje son obligatorios', 'error');
        return;
    }

    let therapistName = null;
    if (therapistId) {
        const therapist = state.staff.find(s => s.id == therapistId);
        therapistName = therapist ? therapist.name : null;
    }

    const newMessage = {
        id: Date.now(),
        name,
        email,
        whatsapp,
        therapistId: therapistId || null,
        therapistName,
        rating: parseInt(rating),
        text,
        date: new Date().toISOString().split('T')[0]
    };

    state.messages.push(newMessage);
    import('../main.js').then(main => main.save());
    renderMessages();
    updateMarquee();
    closeMessageModal();
    showToast('¡Gracias por tu mensaje!', 'success');
}

export function renderMessages() {
    const container = document.getElementById('messagesGrid');
    if (!container) return;

    const recentMessages = [...state.messages].reverse().slice(0, 6);

    if (recentMessages.length === 0) {
        container.innerHTML = '<p style="text-align:center;">No hay mensajes aún. ¡Sé el primero en dejar tu experiencia!</p>';
        return;
    }

    container.innerHTML = recentMessages.map(m => `
        <div class="message-card">
            <div class="message-header">
                <span class="message-author">${m.name}</span>
                <span class="message-rating">${'★'.repeat(m.rating)}${'☆'.repeat(5-m.rating)}</span>
            </div>
            <div class="message-text">${m.text}</div>
            <div class="message-footer">
                <span><i class="fa fa-calendar"></i> ${m.date}</span>
                ${m.therapistName ? `<span><i class="fa fa-user-md"></i> ${m.therapistName}</span>` : ''}
            </div>
        </div>
    `).join('');
}

export function renderMessagesTable() {
    const tb = document.getElementById('messagesTableBody');
    if (!tb) return;

    tb.innerHTML = [...state.messages].reverse().map(m => `
        <tr>
            <td>${m.date}</td>
            <td>${m.name}</td>
            <td>${m.therapistName || 'General'}</td>
            <td>${'★'.repeat(m.rating)}</td>
            <td>${m.text.substring(0, 50)}${m.text.length > 50 ? '...' : ''}</td>
            <td>
                ${m.email ? `<i class="fa fa-envelope"></i> ` : ''}
                ${m.whatsapp ? `<i class="fab fa-whatsapp"></i>` : ''}
            </td>
            <td>
                <button onclick="deleteMessage('${m.id}')" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ✅ FUNCIÓN CORREGIDA - Ahora guarda en Firebase y maneja correctamente los IDs
export function deleteMessage(id) {
    console.log("🗑️ Intentando eliminar mensaje con ID:", id);
    console.log("📊 Tipo de ID:", typeof id);
    console.log("📊 Mensajes antes:", state.messages.length);
    
    if (confirm('¿Eliminar este mensaje permanentemente?')) {
        // Asegurar que comparamos como strings
        const newMessages = state.messages.filter(m => String(m.id) !== String(id));
        
        console.log("📊 Mensajes después:", newMessages.length);
        
        // Actualizar el estado global
        state.setMessages(newMessages);
        
        // Guardar en Firebase
        import('./main.js').then(main => {
            main.save();
            
            // Actualizar las vistas
            renderMessagesTable();
            renderMessages();
            updateMarquee();
            
            showToast('Mensaje eliminado permanentemente', 'success');
        }).catch(err => {
            console.error("❌ Error al guardar:", err);
            showToast('Error al eliminar el mensaje', 'error');
        });
    }
}

export function updateMarquee() {
    const marquee = document.getElementById('marqueeContent');
    if (!marquee) return;

    const allMessages = [...state.messages, ...state.messages, ...state.messages].slice(0, 15);

    if (allMessages.length === 0) {
        marquee.innerHTML = '<div class="marquee-item">Comparte tu experiencia</div>';
        return;
    }

    marquee.innerHTML = allMessages.map(m => `
        <div class="marquee-item">
            <i class="fa fa-quote-right"></i>
            <span>${m.name}: "${m.text.substring(0, 40)}${m.text.length > 40 ? '...' : ''}"</span>
            <span class="stars">${'★'.repeat(m.rating)}</span>
        </div>
    `).join('');
}