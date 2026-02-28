// js/modules/profesionales.js
import { db } from '../config/firebase.js';
import * as state from './state.js';
import { showToast } from './utils.js';

export function showAddStaffModal() {
    document.getElementById('addStaffModal').style.display = 'flex';
    document.getElementById('addName').value = '';
    document.getElementById('addEmail').value = '';
    document.getElementById('addSpec').selectedIndex = -1;
    document.getElementById('addUser').value = '';
    document.getElementById('addPass').value = '';
    document.getElementById('addWhatsapp').value = '';
    document.getElementById('addInstagram').value = '';
    document.getElementById('addAddress').value = '';
    document.getElementById('addPhone').value = '';
    document.getElementById('addPriceOnline').value = '';
    document.getElementById('addPricePresencial').value = '';
    document.getElementById('addBank').value = '';
    document.getElementById('addAccountType').value = 'corriente';
    document.getElementById('addAccountNumber').value = '';
    document.getElementById('addBankRut').value = '';
    document.getElementById('addBankEmail').value = '';
    document.getElementById('addPhotoPreview').style.display = 'none';
    state.setTempImageData(null);
    state.setTempQrData(null);
}

export function closeAddStaffModal() {
    document.getElementById('addStaffModal').style.display = 'none';
}

export function renderStaffTable() {
    const tb = document.getElementById('staffTableBody');
    if (!tb) return;

    const visibleStaff = state.staff.filter(s => !s.isHiddenAdmin);
    tb.innerHTML = visibleStaff.map(p => {
        const specs = Array.isArray(p.spec) ? p.spec.join(', ') : p.spec;
        return `
        <tr>
            <td>${p.name}</td>
            <td>${p.email || '—'}</td>
            <td>${specs.substring(0, 30)}...</td>
            <td>${p.usuario || p.name || '—'}</td>
            <td>$${p.priceOnline}/$${p.pricePresencial}</td>
            <td>${p.whatsapp || '—'}</td>
            <td>${p.instagram || '—'}</td>
            <td>
                ${p.paymentLinks?.online ? '✅ Online' : '❌ Online'}<br>
                ${p.paymentLinks?.presencial ? '✅ Presencial' : '❌ Presencial'}
            </td>
            <td>
                <button onclick="editTherapist('${p.id}')" class="btn-icon" style="background:var(--azul-medico); color:white;">
                    <i class="fa fa-edit"></i>
                </button>
                <button onclick="deleteStaff('${p.id}')" class="btn-icon" style="background:var(--rojo-alerta); color:white;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

export function addStaff() {
    const name = document.getElementById('addName').value;
    const email = document.getElementById('addEmail').value;
    const specSelect = document.getElementById('addSpec');
    const selectedSpecs = Array.from(specSelect.selectedOptions).map(opt => opt.value);
    const priceOnline = document.getElementById('addPriceOnline').value;
    const pricePresencial = document.getElementById('addPricePresencial').value;
    const usuario = document.getElementById('addUser').value;
    const pass = document.getElementById('addPass').value;
    const whatsapp = document.getElementById('addWhatsapp')?.value || '';
    const instagram = document.getElementById('addInstagram')?.value || '';
    const address = document.getElementById('addAddress')?.value || '';
    const phone = document.getElementById('addPhone')?.value || '';
    const bank = document.getElementById('addBank')?.value || '';
    const accountType = document.getElementById('addAccountType')?.value || 'corriente';
    const accountNumber = document.getElementById('addAccountNumber')?.value || '';
    const bankRut = document.getElementById('addBankRut')?.value || '';
    const bankEmail = document.getElementById('addBankEmail')?.value || '';
    const paymentLinkOnline = document.getElementById('addPaymentLinkOnline')?.value || '';
    const paymentLinkPresencial = document.getElementById('addPaymentLinkPresencial')?.value || '';

    if (!name || !email || selectedSpecs.length === 0 || !priceOnline || !pricePresencial || !usuario || !pass) {
        showToast('Completa todos los campos obligatorios', 'error');
        return;
    }

    if (state.staff.some(s => s.usuario === usuario)) {
        showToast('El usuario ya existe', 'error');
        return;
    }

    state.staff.push({
        id: Date.now(),
        name,
        email,
        spec: selectedSpecs,
        priceOnline: parseInt(priceOnline),
        pricePresencial: parseInt(pricePresencial),
        usuario,
        pass,
        whatsapp,
        instagram,
        img: state.tempImageData || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500',
        address,
        phone,
        bankDetails: { bank, accountType, accountNumber, rut: bankRut, email: bankEmail },
        paymentMethods: { ...state.globalPaymentMethods },
        stars: 5,
        sessionDuration: 45,
        breakBetween: 10,
        availability: {},
        paymentLinks: { online: paymentLinkOnline, presencial: paymentLinkPresencial, qrCode: state.tempQrData || '' }
    });

    import('./main.js').then(main => main.save());
    closeAddStaffModal();
    showToast('Profesional añadido', 'success');
}

export function editTherapist(id) {
    const therapist = state.staff.find(s => s.id == id);
    if (!therapist) return;

    document.getElementById('editTherapistId').value = therapist.id;
    document.getElementById('editName').value = therapist.name || '';
    document.getElementById('editEmail').value = therapist.email || '';

    const editSpecSelect = document.getElementById('editSpec');
    const therapistSpecs = Array.isArray(therapist.spec) ? therapist.spec : [therapist.spec];
    Array.from(editSpecSelect.options).forEach(opt => {
        opt.selected = therapistSpecs.includes(opt.value);
    });

    document.getElementById('editUser').value = therapist.usuario || '';
    document.getElementById('editPass').value = '';
    document.getElementById('editWhatsapp').value = therapist.whatsapp || '';
    document.getElementById('editInstagram').value = therapist.instagram || '';
    document.getElementById('editAddress').value = therapist.address || '';
    document.getElementById('editPhone').value = therapist.phone || '';
    document.getElementById('editPriceOnline').value = therapist.priceOnline || '';
    document.getElementById('editPricePresencial').value = therapist.pricePresencial || '';

    const bank = therapist.bankDetails || {};
    document.getElementById('editBank').value = bank.bank || '';
    document.getElementById('editAccountType').value = bank.accountType || 'corriente';
    document.getElementById('editAccountNumber').value = bank.accountNumber || '';
    document.getElementById('editBankRut').value = bank.rut || '';
    document.getElementById('editBankEmail').value = bank.email || '';

    document.getElementById('editPaymentLinkOnline').value = therapist.paymentLinks?.online || '';
    document.getElementById('editPaymentLinkPresencial').value = therapist.paymentLinks?.presencial || '';
    if (therapist.paymentLinks?.qrCode) {
        document.getElementById('editQrPreview').src = therapist.paymentLinks.qrCode;
        document.getElementById('editQrPreview').style.display = 'block';
    } else {
        document.getElementById('editQrPreview').style.display = 'none';
    }

    if (therapist.img) {
        document.getElementById('editPhotoPreview').src = therapist.img;
        document.getElementById('editPhotoPreview').style.display = 'block';
    } else {
        document.getElementById('editPhotoPreview').style.display = 'none';
    }

    state.setTempImageData(null);
    state.setTempQrData(null);
    document.getElementById('editTherapistModal').style.display = 'flex';
}

export function closeEditTherapistModal() {
    document.getElementById('editTherapistModal').style.display = 'none';
}

export function updateTherapist() {
    const id = document.getElementById('editTherapistId').value;
    const therapist = state.staff.find(s => s.id == id);
    if (!therapist) return;

    therapist.name = document.getElementById('editName').value;
    therapist.email = document.getElementById('editEmail').value;

    const editSpecSelect = document.getElementById('editSpec');
    therapist.spec = Array.from(editSpecSelect.selectedOptions).map(opt => opt.value);

    therapist.usuario = document.getElementById('editUser').value;
    therapist.whatsapp = document.getElementById('editWhatsapp').value;
    therapist.instagram = document.getElementById('editInstagram').value;
    therapist.address = document.getElementById('editAddress').value;
    therapist.phone = document.getElementById('editPhone').value;
    therapist.priceOnline = parseInt(document.getElementById('editPriceOnline').value);
    therapist.pricePresencial = parseInt(document.getElementById('editPricePresencial').value);

    therapist.bankDetails = {
        bank: document.getElementById('editBank').value,
        accountType: document.getElementById('editAccountType').value,
        accountNumber: document.getElementById('editAccountNumber').value,
        rut: document.getElementById('editBankRut').value,
        email: document.getElementById('editBankEmail').value
    };

    therapist.paymentLinks = {
        online: document.getElementById('editPaymentLinkOnline').value,
        presencial: document.getElementById('editPaymentLinkPresencial').value,
        qrCode: state.tempQrData || therapist.paymentLinks?.qrCode || ''
    };

    if (state.tempImageData) {
        therapist.img = state.tempImageData;
    }

    const newPass = document.getElementById('editPass').value;
    if (newPass) therapist.pass = newPass;

    import('./main.js').then(main => main.save());
    closeEditTherapistModal();
    renderStaffTable();
    showToast('Profesional actualizado', 'success');
}

export function deleteStaff(id) {
    const therapist = state.staff.find(s => s.id == id);
    if (therapist?.isHiddenAdmin) {
        showToast('No se puede eliminar al admin', 'error');
        return;
    }
    if (confirm('¿Eliminar profesional y todos sus datos?')) {
        state.setAppointments(state.appointments.filter(a => a.psychId != id));
        state.setPatients(state.patients.filter(p => p.psychId != id));
        state.setStaff(state.staff.filter(s => s.id != id));
        import('./main.js').then(main => main.save());
        showToast('Profesional eliminado', 'success');
    }
}