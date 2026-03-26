// js/modules/mensajes.js
import * as state from './state.js';
import { showToast } from './utils.js';
import { save } from '../main.js';

// ============================================
// FUNCIONES PARA MODAL DE MENSAJES
// ============================================

export function showMessageModal() {
    const modal = document.getElementById('messageModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    loadTherapistsForMessage();
    setRating(5);
}

export function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    if (modal) modal.style.display = 'none';
    
    const nameInput = document.getElementById('messageName');
    const emailInput = document.getElementById('messageEmail');
    const whatsappInput = document.getElementById('messageWhatsapp');
    const textInput = document.getElementById('messageText');
    
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (whatsappInput) whatsappInput.value = '';
    if (textInput) textInput.value = '';
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
    
    const ratingInput = document.getElementById('messageRating');
    if (ratingInput) ratingInput.value = rating;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.getElementById(`star${i}`);
        if (star) {
            star.textContent = i <= rating ? '★' : '☆';
        }
    }
}

// ============================================
// FUNCIÓN PARA GUARDAR MENSAJE (MEJORADA)
// ============================================

export async function saveMessage() {
    const nameInput = document.getElementById('messageName');
    const emailInput = document.getElementById('messageEmail');
    const whatsappInput = document.getElementById('messageWhatsapp');
    const therapistSelect = document.getElementById('messageTherapist');
    const ratingInput = document.getElementById('messageRating');
    const textInput = document.getElementById('messageText');
    
    const name = nameInput?.value || '';
    const email = emailInput?.value || '';
    const whatsapp = whatsappInput?.value || '';
    const therapistId = therapistSelect?.value || '';
    const rating = ratingInput?.value || '5';
    const text = textInput?.value || '';

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
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    state.messages.push(newMessage);
    
    try {
        await save();
        renderMessages();
        updateMarquee();
        closeMessageModal();
        showToast('¡Gracias por tu mensaje!', 'success');
    } catch (error) {
        console.error('❌ Error guardando mensaje:', error);
        showToast('Error al guardar el mensaje', 'error');
    }
}

// ============================================
// FUNCIONES DE RENDERIZADO
// ============================================

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

// ============================================
// FUNCIÓN PARA ELIMINAR MENSAJE (CORREGIDA)
// ============================================

export async function deleteMessage(id) {
    console.log("🗑️ Intentando eliminar mensaje con ID:", id);
    console.log("📊 Tipo de ID:", typeof id);
    console.log("📊 Mensajes antes:", state.messages.length);
    
    if (confirm('¿Eliminar este mensaje permanentemente?')) {
        const newMessages = state.messages.filter(m => String(m.id) !== String(id));
        
        console.log("📊 Mensajes después:", newMessages.length);
        
        state.setMessages(newMessages);
        
        try {
            await save();
            renderMessagesTable();
            renderMessages();
            updateMarquee();
            showToast('Mensaje eliminado permanentemente', 'success');
        } catch (err) {
            console.error("❌ Error al guardar:", err);
            showToast('Error al eliminar el mensaje', 'error');
        }
    }
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR MARQUESINA
// ============================================

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

// ============================================
// NUEVAS FUNCIONES PARA ESTADÍSTICAS DE MENSAJES
// ============================================

/**
 * Obtiene estadísticas de mensajes
 * @returns {Object} Estadísticas de mensajes
 */
export function getMessageStats() {
    const total = state.messages.length;
    const conTherapist = state.messages.filter(m => m.therapistId).length;
    const sinTherapist = total - conTherapist;
    
    const ratingPromedio = total > 0 
        ? (state.messages.reduce((sum, m) => sum + m.rating, 0) / total).toFixed(1)
        : 0;
    
    const distribucionRating = {
        1: state.messages.filter(m => m.rating === 1).length,
        2: state.messages.filter(m => m.rating === 2).length,
        3: state.messages.filter(m => m.rating === 3).length,
        4: state.messages.filter(m => m.rating === 4).length,
        5: state.messages.filter(m => m.rating === 5).length
    };
    
    // Mensajes por profesional
    const porProfesional = {};
    state.messages.forEach(m => {
        if (m.therapistName) {
            porProfesional[m.therapistName] = (porProfesional[m.therapistName] || 0) + 1;
        }
    });
    
    return {
        total,
        conTherapist,
        sinTherapist,
        ratingPromedio,
        distribucionRating,
        porProfesional
    };
}

/**
 * Filtra mensajes por profesional
 * @param {string} therapistId - ID del profesional
 * @returns {Array} Mensajes filtrados
 */
export function getMessagesByTherapist(therapistId) {
    return state.messages.filter(m => m.therapistId == therapistId);
}

/**
 * Obtiene los últimos mensajes destacados (5 estrellas)
 * @param {number} limit - Límite de resultados
 * @returns {Array} Mensajes destacados
 */
export function getFeaturedMessages(limit = 3) {
    return state.messages
        .filter(m => m.rating === 5)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}

/**
 * Busca mensajes por texto
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} Mensajes que coinciden
 */
export function searchMessages(searchTerm) {
    if (!searchTerm) return state.messages;
    
    const term = searchTerm.toLowerCase();
    return state.messages.filter(m => 
        m.name.toLowerCase().includes(term) ||
        m.text.toLowerCase().includes(term) ||
        (m.therapistName && m.therapistName.toLowerCase().includes(term))
    );
}

// ============================================
// FUNCIONES PARA ADMIN DE MENSAJES
// ============================================

/**
 * Elimina todos los mensajes
 */
export async function deleteAllMessages() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Eliminar TODOS los mensajes? Esta acción no se puede deshacer.')) {
        const cantidad = state.messages.length;
        state.setMessages([]);
        try {
            await save();
            renderMessagesTable();
            renderMessages();
            updateMarquee();
            showToast(`✅ ${cantidad} mensajes eliminados`, 'success');
        } catch (error) {
            console.error('❌ Error al eliminar mensajes:', error);
            showToast('Error al eliminar mensajes', 'error');
        }
    }
}

/**
 * Exporta mensajes a JSON
 */
export function exportMessages() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const data = {
        fecha: new Date().toISOString(),
        total: state.messages.length,
        messages: state.messages
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mensajes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ Mensajes exportados', 'success');
}

/**
 * Importa mensajes desde JSON
 */
export async function importMessages() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                
                if (data.messages && Array.isArray(data.messages)) {
                    if (confirm(`¿Importar ${data.messages.length} mensajes?`)) {
                        state.setMessages([...state.messages, ...data.messages]);
                        await save();
                        renderMessagesTable();
                        renderMessages();
                        updateMarquee();
                        showToast(`✅ ${data.messages.length} mensajes importados`, 'success');
                    }
                } else {
                    showToast('❌ Formato de archivo inválido', 'error');
                }
            } catch (error) {
                console.error('Error importando:', error);
                showToast('❌ Error al importar', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

/**
 * Restaura mensajes de ejemplo
 */
export async function restoreSampleMessages() {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Solo administradores pueden hacer esto', 'error');
        return;
    }
    
    const sampleMessages = [
        { 
            id: Date.now() + 1, 
            name: 'Carolina Méndez', 
            rating: 5, 
            text: 'Excelente profesional, me ayudó mucho con mi ansiedad. Muy recomendada.', 
            date: new Date().toISOString().split('T')[0],
            therapistName: 'Marcelo Pino'
        },
        { 
            id: Date.now() + 2, 
            name: 'Roberto Campos', 
            rating: 5, 
            text: 'Muy buena página, encontré al especialista que necesitaba rápidamente.', 
            date: new Date().toISOString().split('T')[0],
            therapistName: null
        },
        { 
            id: Date.now() + 3, 
            name: 'María José', 
            rating: 4, 
            text: 'Muy profesional, aunque los tiempos de espera a veces son largos.', 
            date: new Date().toISOString().split('T')[0],
            therapistName: 'Marcelo Pino'
        },
        { 
            id: Date.now() + 4, 
            name: 'Juan Pérez', 
            rating: 5, 
            text: 'Ambiente muy acogedor y profesional. Sin duda volveré.', 
            date: new Date().toISOString().split('T')[0],
            therapistName: 'Marcelo Pino'
        },
        { 
            id: Date.now() + 5, 
            name: 'Ana Silva', 
            rating: 5, 
            text: 'La terapia online funciona perfecto, muy cómodo desde casa.', 
            date: new Date().toISOString().split('T')[0],
            therapistName: null
        }
    ];
    
    state.setMessages(sampleMessages);
    try {
        await save();
        renderMessagesTable();
        renderMessages();
        updateMarquee();
        showToast('✅ Mensajes de ejemplo restaurados', 'success');
    } catch (error) {
        console.error('❌ Error restaurando mensajes:', error);
        showToast('Error al restaurar mensajes', 'error');
    }
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
if (typeof window !== 'undefined') {
    window.showMessageModal = showMessageModal;
    window.closeMessageModal = closeMessageModal;
    window.setRating = setRating;
    window.saveMessage = saveMessage;
    window.deleteMessage = deleteMessage;
    window.renderMessages = renderMessages;
    window.renderMessagesTable = renderMessagesTable;
    window.updateMarquee = updateMarquee;
    
    window.getMessageStats = getMessageStats;
    window.getMessagesByTherapist = getMessagesByTherapist;
    window.getFeaturedMessages = getFeaturedMessages;
    window.searchMessages = searchMessages;
    window.deleteAllMessages = deleteAllMessages;
    window.exportMessages = exportMessages;
    window.importMessages = importMessages;
    window.restoreSampleMessages = restoreSampleMessages;
}

console.log('✅ mensajes.js refactorizado: import save directo, async/await, manejo de errores');