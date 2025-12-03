document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const paymentForm = document.getElementById('paymentForm');
    const expenseForm = document.getElementById('expenseForm');
    const paymentTableBody = document.getElementById('paymentTableBody');
    const expenseTableBody = document.getElementById('expenseTableBody');
    const rekapKelasTableBody = document.getElementById('rekapKelasTableBody');
    const totalPemasukanSpan = document.getElementById('totalPemasukan');
    const todayPemasukanSpan = document.getElementById('todayPemasukan');
    const totalSiswaSpan = document.getElementById('totalSiswa');
    const totalPengeluaranSpan = document.getElementById('totalPengeluaran');
    const todayPengeluaranSpan = document.getElementById('todayPengeluaran');
    const saldoBersihSpan = document.getElementById('saldoBersih');
    const showingCountSpan = document.getElementById('showingCount');
    const totalCountSpan = document.getElementById('totalCount');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    const expenseShowingCountSpan = document.getElementById('expenseShowingCount');
    const expenseTotalCountSpan = document.getElementById('expenseTotalCount');
    const expenseCurrentPageSpan = document.getElementById('expenseCurrentPage');
    const expenseTotalPagesSpan = document.getElementById('expenseTotalPages');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const expensePrevPageBtn = document.getElementById('expensePrevPage');
    const expenseNextPageBtn = document.getElementById('expenseNextPage');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const expenseResetFiltersBtn = document.getElementById('expenseResetFilters');
    const chartCanvas = document.getElementById('paymentChart');
    const chartContainer = chartCanvas ? chartCanvas.parentElement : null; // Ambil container chart
    const chartTypeSelect = document.getElementById('chartType');
    const siswaNamesDatalist = document.getElementById('siswaNames');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Filter elements
    const filterTanggalInput = document.getElementById('filterTanggal');
    const filterKelasInput = document.getElementById('filterKelas');
    const filterKeteranganInput = document.getElementById('filterKeterangan');
    const searchNamaInput = document.getElementById('searchNama');
    const expenseFilterTanggalInput = document.getElementById('expenseFilterTanggal');
    const expenseSearchKeteranganInput = document.getElementById('expenseSearchKeterangan');
    
    // Modal elements
    const paymentModal = document.getElementById('paymentDetailModal');
    const expenseModal = document.getElementById('expenseDetailModal');
    const modalContent = document.getElementById('modalContent');
    const expenseModalContent = document.getElementById('expenseModalContent');
    const closeModals = document.querySelectorAll('.close-modal');
    
    // App state
    let payments = [];
    let expenses = [];
    let currentPage = 1;
    let expenseCurrentPage = 1;
    const itemsPerPage = 10;
    let sortConfig = { key: 'tanggal', direction: 'desc' };
    let expenseSortConfig = { key: 'tanggal', direction: 'desc' };
    
    let paymentChartInstance;
    
    // Initialize the app
    init();
    
    function init() {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tanggal').value = today;
        document.getElementById('expenseTanggal').value = today;
        
        // ** PENTING: Untuk memastikan code masih seperti baru, kita hapus data lama saat inisialisasi **
        localStorage.removeItem('payments');
        localStorage.removeItem('expenses');

        // Load data (akan menghasilkan array kosong karena local storage sudah dihapus di atas)
        loadPayments();
        loadExpenses();
        
        // Event listeners (sisanya sama)
        paymentForm.addEventListener('submit', handlePaymentFormSubmit);
        expenseForm.addEventListener('submit', handleExpenseFormSubmit);
        paymentTableBody.addEventListener('click', handlePaymentTableActions);
        expenseTableBody.addEventListener('click', handleExpenseTableActions);
        rekapKelasTableBody.addEventListener('click', handleRekapKelasActions);
        resetFiltersBtn.addEventListener('click', resetFilters);
        expenseResetFiltersBtn.addEventListener('click', resetExpenseFilters);
        prevPageBtn.addEventListener('click', goToPrevPage);
        nextPageBtn.addEventListener('click', goToNextPage);
        expensePrevPageBtn.addEventListener('click', goToExpensePrevPage);
        expenseNextPageBtn.addEventListener('click', goToExpenseNextPage);
        chartTypeSelect.addEventListener('change', () => updateChart(getFilteredAndSortedPayments()));
        
        // Tab navigation
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // Close modal event listeners
        closeModals.forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('show');
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === paymentModal) paymentModal.classList.remove('show');
            if (e.target === expenseModal) expenseModal.classList.remove('show');
        });
        
        // Add sorting to table headers
        document.querySelectorAll('#paymentTable th[data-sortable]').forEach(header => {
            header.addEventListener('click', () => {
                const key = header.getAttribute('data-sortable');
                if (sortConfig.key === key) {
                    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    sortConfig.key = key;
                    sortConfig.direction = 'asc';
                }
                currentPage = 1;
                applyFiltersAndPagination();
            });
        });
        
        // Add sorting to expense table headers
        document.querySelectorAll('#expenseTable th[data-sortable]').forEach(header => {
            header.addEventListener('click', () => {
                const key = header.getAttribute('data-sortable');
                if (expenseSortConfig.key === key) {
                    expenseSortConfig.direction = expenseSortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    expenseSortConfig.key = key;
                    expenseSortConfig.direction = 'asc';
                }
                expenseCurrentPage = 1;
                applyExpenseFiltersAndPagination();
            });
        });
        
        // Filter event listeners
        [filterTanggalInput, filterKelasInput, filterKeteranganInput, searchNamaInput].forEach(input => {
            if (input) input.addEventListener('input', debounce(applyFiltersAndPagination, 300));
        });
        
        // Expense filter event listeners
        [expenseFilterTanggalInput, expenseSearchKeteranganInput].forEach(input => {
            if (input) input.addEventListener('input', debounce(applyExpenseFiltersAndPagination, 300));
        });
    }

    function loadPayments() {
        try {
            const storedPayments = localStorage.getItem('payments');
            payments = storedPayments ? JSON.parse(storedPayments) : [];
        } catch (error) {
            console.error("Gagal memuat data pembayaran:", error);
            payments = [];
        }
        applyFiltersAndPagination();
        updateSummaryCards();
        updateSiswaNamesDatalist();
    }
    
    function loadExpenses() {
        try {
            const storedExpenses = localStorage.getItem('expenses');
            expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
        } catch (error) {
            console.error("Gagal memuat data pengeluaran:", error);
            expenses = [];
        }
        applyExpenseFiltersAndPagination();
        updateSummaryCards();
    }
    
    // === FUNGSI FORMAT RUPIAH YANG DISEMUPURNAKAN (Menghapus Undefined) ===
    function formatRupiah(number, withSymbol = true) {
        // Mengganti nilai undefined/null/NaN dengan 0 untuk mencegah "undefined"
        const num = number === undefined || number === null || isNaN(number) ? 0 : number;

        // Jika nilainya 0, tampilkan 0 atau 'Rp 0'
        if (num === 0) {
            return withSymbol ? 'Rp 0' : '0';
        }

        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        });

        // Jika withSymbol=false, hapus "Rp" dan spasi non-breaking
        if (!withSymbol) {
            // Menggunakan regex untuk menghapus "Rp" dan spasi/karakter non-digit sebelum angka
            return formatter.format(num).replace(/[Rp.\s]/g, '').trim(); 
        }

        return formatter.format(num);
    }
    
    function savePayments() {
        try {
            localStorage.setItem('payments', JSON.stringify(payments));
            updateSummaryCards();
            updateSiswaNamesDatalist();
        } catch (error) {
            console.error("Gagal menyimpan data pembayaran:", error);
            showError('Gagal menyimpan data. Periksa konsol untuk detailnya.');
        }
    }
    
    function saveExpenses() {
        try {
            localStorage.setItem('expenses', JSON.stringify(expenses));
            updateSummaryCards();
        } catch (error) {
            console.error("Gagal menyimpan data pengeluaran:", error);
            showError('Gagal menyimpan data. Periksa konsol untuk detailnya.');
        }
    }
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function updateSiswaNamesDatalist() {
        if (!siswaNamesDatalist) return;
        const uniqueNames = [...new Set(payments.map(p => p.namaSiswa))].sort();
        siswaNamesDatalist.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join('');
    }
    
    function switchTab(tabId) {
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    }
    
    // Data processing functions
    function getFilteredAndSortedPayments() {
        const filterTanggal = filterTanggalInput.value;
        const filterKelas = filterKelasInput.value;
        const filterKeterangan = filterKeteranganInput.value;
        const searchNama = searchNamaInput.value.toLowerCase().trim();
        
        const filteredData = payments.filter(payment => {
            const matchTanggal = !filterTanggal || payment.tanggal === filterTanggal;
            const matchKelas = !filterKelas || payment.kelas === filterKelas;
            const matchKeterangan = !filterKeterangan || payment.keterangan === filterKeterangan;
            const matchNama = !searchNama || (payment.namaSiswa && payment.namaSiswa.toLowerCase().includes(searchNama));
            
            return matchTanggal && matchKelas && matchKeterangan && matchNama;
        });
        
        const sortableData = [...filteredData];
        sortableData.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sortableData;
    }
    
    function getFilteredAndSortedExpenses() {
        const filterTanggal = expenseFilterTanggalInput.value;
        const searchKeterangan = expenseSearchKeteranganInput.value.toLowerCase().trim();
        
        const filteredData = expenses.filter(expense => {
            const matchTanggal = !filterTanggal || expense.tanggal === filterTanggal;
            const matchKeterangan = !searchKeterangan || (expense.keterangan && expense.keterangan.toLowerCase().includes(searchKeterangan));
            
            return matchTanggal && matchKeterangan;
        });
        
        const sortableData = [...filteredData];
        sortableData.sort((a, b) => {
            const aValue = a[expenseSortConfig.key];
            const bValue = b[expenseSortConfig.key];
            
            if (aValue < bValue) return expenseSortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return expenseSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sortableData;
    }
    
    function applyFiltersAndPagination() {
        const sortedData = getFilteredAndSortedPayments();
        const paginatedData = paginateData(sortedData, currentPage, itemsPerPage);
        
        renderPayments(paginatedData);
        renderRekapPerKelas(sortedData);
        updateChart(sortedData);
        updatePagination(sortedData.length);
        updateTableHeaders();
        
        showingCountSpan.textContent = paginatedData.length;
        totalCountSpan.textContent = sortedData.length;
    }
    
    function applyExpenseFiltersAndPagination() {
        const sortedData = getFilteredAndSortedExpenses();
        const paginatedData = paginateData(sortedData, expenseCurrentPage, itemsPerPage);
        
        renderExpenses(paginatedData);
        updateExpensePagination(sortedData.length);
        updateExpenseTableHeaders();
        
        expenseShowingCountSpan.textContent = paginatedData.length;
        expenseTotalCountSpan.textContent = sortedData.length;
    }
    
    function paginateData(data, page, perPage) {
        const startIndex = (page - 1) * perPage;
        return data.slice(startIndex, startIndex + perPage);
    }
    
    // Render functions
    function renderPayments(data) {
        paymentTableBody.innerHTML = '';
        
        if (data.length === 0) {
            paymentTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table">Belum ada data pembayaran.</td>
                </tr>
            `;
        } else {
            data.forEach((payment, index) => {
                const row = document.createElement('tr');
                const jumlahFormatted = formatRupiah(payment.jumlah, false);
                const catatanDisplay = payment.catatan || '-'; 
                
                row.innerHTML = `
                    <td>${index + 1 + (currentPage - 1) * itemsPerPage}</td>
                    <td>${payment.tanggal}</td>
                    <td>${payment.namaSiswa || '-'}</td>
                    <td>${payment.kelas || '-'}</td>
                    <td>${payment.keterangan || '-'}</td>
                    <td class="text-right">${jumlahFormatted}</td>
                    <td>${catatanDisplay}</td>
                    <td class="actions">
                        <button class="action-btn btn-view" data-id="${payment.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn btn-delete" data-id="${payment.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                paymentTableBody.appendChild(row);
            });
        }
    }
    
    function renderExpenses(data) {
        expenseTableBody.innerHTML = '';
        
        if (data.length === 0) {
            expenseTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">Belum ada data pengeluaran.</td>
                </tr>
            `;
        } else {
            data.forEach((expense, index) => {
                const row = document.createElement('tr');
                const jumlahFormatted = formatRupiah(expense.jumlah, false);
                const catatanDisplay = expense.catatan || '-'; 

                row.innerHTML = `
                    <td>${index + 1 + (expenseCurrentPage - 1) * itemsPerPage}</td>
                    <td>${expense.tanggal}</td>
                    <td>${expense.keterangan || '-'}</td>
                    <td class="text-right">${jumlahFormatted}</td>
                    <td>${catatanDisplay}</td>
                    <td class="actions">
                        <button class="action-btn btn-view" data-id="${expense.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn btn-delete" data-id="${expense.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                expenseTableBody.appendChild(row);
            });
        }
    }
    
    function renderRekapPerKelas(data) {
        rekapKelasTableBody.innerHTML = '';
        
        const rekapData = data.reduce((acc, current) => {
            if (!acc[current.kelas]) {
                acc[current.kelas] = { count: 0, total: 0 };
            }
            acc[current.kelas].count++;
            acc[current.kelas].total += current.jumlah;
            return acc;
        }, {});
        
        const kelasList = Object.keys(rekapData).sort();
        
        if (kelasList.length === 0) {
            rekapKelasTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-table">Belum ada data per kelas.</td>
                </tr>
            `;
        } else {
            kelasList.forEach(kelas => {
                const row = document.createElement('tr');
                const totalFormatted = formatRupiah(rekapData[kelas].total); 

                row.innerHTML = `
                    <td>${kelas}</td>
                    <td>${rekapData[kelas].count}</td>
                    <td>${totalFormatted}</td>
                    <td>
                        <button class="action-btn btn-view" data-kelas="${kelas}">
                            <i class="fas fa-list"></i> Lihat
                        </button>
                    </td>
                `;
                rekapKelasTableBody.appendChild(row);
            });
        }
    }
    
    // === FUNGSI CHART YANG DISEMUPURNAKAN (Memastikan Muncul dan Menampilkan Rupiah) ===
    function updateChart(data) {
        if (!chartCanvas || !chartContainer) return;

        // Hancurkan instance chart lama jika ada
        if (paymentChartInstance) {
            paymentChartInstance.destroy();
        }
        
        // Hapus pesan "Tidak ada data" sebelumnya jika ada
        chartContainer.querySelector('.empty-chart')?.remove();
        
        const aggregatedData = data.reduce((acc, current) => {
            acc[current.keterangan] = (acc[current.keterangan] || 0) + current.jumlah;
            return acc;
        }, {});
        
        const labels = Object.keys(aggregatedData);
        const values = Object.values(aggregatedData);
        const chartType = chartTypeSelect.value;
        
        if (labels.length === 0) {
             // Tampilkan pesan "Tidak ada data" jika data kosong
             const p = document.createElement('p');
             p.classList.add('empty-chart');
             p.textContent = 'Tidak ada data pembayaran untuk ditampilkan pada grafik.';
             chartContainer.appendChild(p);
             // Pastikan canvas tetap ada tapi disembunyikan jika perlu
             chartCanvas.style.display = 'none';
             return;
        }

        // Tampilkan kembali canvas jika sebelumnya disembunyikan
        chartCanvas.style.display = 'block';

        const ctx = chartCanvas.getContext('2d');
        paymentChartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Pemasukan (Rp)',
                    data: values,
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(248, 150, 30, 0.7)',
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(63, 55, 201, 0.7)',
                        'rgba(114, 214, 121, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: chartType === 'pie' ? 'right' : 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                // Menampilkan Rupiah di tooltip
                                return `${context.label}: ${formatRupiah(context.parsed.y || context.parsed)}`; 
                            }
                        }
                    }
                },
                scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                // Menampilkan Rupiah di sumbu Y
                                return formatRupiah(value); 
                            }
                        }
                    }
                } : {}
            }
        });
    }
    
    function updateSummaryCards() {
        // Pemasukan
        const totalPemasukan = payments.reduce((sum, payment) => sum + payment.jumlah, 0);
        totalPemasukanSpan.textContent = formatRupiah(totalPemasukan); 
        
        const today = new Date().toISOString().split('T')[0];
        const todayPemasukan = payments
            .filter(p => p.tanggal === today)
            .reduce((sum, payment) => sum + payment.jumlah, 0);
        todayPemasukanSpan.textContent = formatRupiah(todayPemasukan);
        
        const uniqueStudents = [...new Set(payments.map(p => p.namaSiswa))];
        totalSiswaSpan.textContent = uniqueStudents.length;
        
        // Pengeluaran
        const totalPengeluaran = expenses.reduce((sum, expense) => sum + expense.jumlah, 0);
        totalPengeluaranSpan.textContent = formatRupiah(totalPengeluaran);
        
        const todayPengeluaran = expenses
            .filter(e => e.tanggal === today)
            .reduce((sum, expense) => sum + expense.jumlah, 0);
        todayPengeluaranSpan.textContent = formatRupiah(todayPengeluaran);
        
        // Saldo Bersih
        const saldoBersih = totalPemasukan - totalPengeluaran;
        saldoBersihSpan.textContent = formatRupiah(saldoBersih);
    }
    
    function updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
    }
    
    function updateExpensePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        expenseCurrentPageSpan.textContent = expenseCurrentPage;
        expenseTotalPagesSpan.textContent = totalPages;
        
        expensePrevPageBtn.disabled = expenseCurrentPage === 1;
        expenseNextPageBtn.disabled = expenseCurrentPage >= totalPages || totalPages === 0;
    }

    function updateTableHeaders() {
        document.querySelectorAll('#paymentTable th[data-sortable]').forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
            const icon = header.querySelector('i.fas');
            if (icon) icon.className = 'fas fa-sort';

            if (header.getAttribute('data-sortable') === sortConfig.key) {
                header.classList.add(`sorted-${sortConfig.direction}`);
                if (icon) {
                    icon.className = `fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`;
                }
            }
        });
    }
    
    function updateExpenseTableHeaders() {
        document.querySelectorAll('#expenseTable th[data-sortable]').forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
            const icon = header.querySelector('i.fas');
            if (icon) icon.className = 'fas fa-sort';

            if (header.getAttribute('data-sortable') === expenseSortConfig.key) {
                header.classList.add(`sorted-${expenseSortConfig.direction}`);
                if (icon) {
                    icon.className = `fas fa-sort-${expenseSortConfig.direction === 'asc' ? 'up' : 'down'}`;
                }
            }
        });
    }
    
    // Event handlers (semua handler form, delete, dan modal detail sudah diperbaiki)
    function handlePaymentFormSubmit(e) {
        e.preventDefault();
        
        const tanggal = document.getElementById('tanggal').value;
        const namaSiswa = document.getElementById('namaSiswa').value.trim();
        const kelas = document.getElementById('kelas').value;
        const keterangan = document.getElementById('keterangan').value;
        const jumlah = parseInt(document.getElementById('jumlah').value);
        const catatan = document.getElementById('catatan').value.trim();
        
        if (!tanggal || !namaSiswa || !kelas || !keterangan || isNaN(jumlah) || jumlah <= 0) {
            showError('Harap isi semua kolom yang diperlukan dengan data yang valid.');
            return;
        }
        
        const newPayment = {
            id: Date.now().toString(),
            tanggal,
            namaSiswa,
            kelas,
            keterangan,
            jumlah,
            catatan: catatan || null 
        };
        
        payments.push(newPayment);
        savePayments();
        applyFiltersAndPagination();
        paymentForm.reset();
        document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
        
        showSuccess('Data pembayaran berhasil ditambahkan.');
    }
    
    function handleExpenseFormSubmit(e) {
        e.preventDefault();
        
        const tanggal = document.getElementById('expenseTanggal').value;
        const keterangan = document.getElementById('expenseKeterangan').value.trim();
        const jumlah = parseInt(document.getElementById('expenseJumlah').value);
        const catatan = document.getElementById('expenseCatatan').value.trim();
        
        if (!tanggal || !keterangan || isNaN(jumlah) || jumlah <= 0) {
            showError('Harap isi semua kolom yang diperlukan dengan data yang valid.');
            return;
        }
        
        const newExpense = {
            id: Date.now().toString(),
            tanggal,
            keterangan,
            jumlah,
            catatan: catatan || null 
        };
        
        expenses.push(newExpense);
        saveExpenses();
        applyExpenseFiltersAndPagination();
        expenseForm.reset();
        document.getElementById('expenseTanggal').value = new Date().toISOString().split('T')[0];
        
        showSuccess('Data pengeluaran berhasil ditambahkan.');
    }
    
    function handlePaymentTableActions(e) {
        const target = e.target.closest('.action-btn');
        if (!target) return;
        
        const paymentId = target.getAttribute('data-id');
        
        if (target.classList.contains('btn-view')) {
            showPaymentDetail(paymentId);
        } else if (target.classList.contains('btn-delete')) {
            deletePayment(paymentId);
        }
    }
    
    function handleExpenseTableActions(e) {
        const target = e.target.closest('.action-btn');
        if (!target) return;
        
        const expenseId = target.getAttribute('data-id');
        
        if (target.classList.contains('btn-view')) {
            showExpenseDetail(expenseId);
        } else if (target.classList.contains('btn-delete')) {
            deleteExpense(expenseId);
        }
    }
    
    function handleRekapKelasActions(e) {
        const target = e.target.closest('.action-btn');
        if (!target) return;
        
        const kelas = target.getAttribute('data-kelas');
        if (kelas) {
            filterKelasInput.value = kelas;
            currentPage = 1;
            applyFiltersAndPagination();
        }
    }
    
    function showPaymentDetail(paymentId) {
        const payment = payments.find(p => p.id === paymentId);
        if (!payment) return;
        
        modalContent.innerHTML = `
            <div class="detail-group">
                <label>Tanggal:</label>
                <p>${payment.tanggal}</p>
            </div>
            <div class="detail-group">
                <label>Nama Siswa:</label>
                <p>${payment.namaSiswa || '-'}</p>
            </div>
            <div class="detail-group">
                <label>Kelas:</label>
                <p>${payment.kelas || '-'}</p>
            </div>
            <div class="detail-group">
                <label>Keterangan:</label>
                <p>${payment.keterangan || '-'}</p>
            </div>
            <div class="detail-group">
                <label>Jumlah:</label>
                <p>${formatRupiah(payment.jumlah)}</p>
            </div>
            <div class="detail-group">
                <label>Catatan:</label>
                <p>${payment.catatan || '-'}</p>
            </div>
        `;
        
        paymentModal.classList.add('show');
    }
    
    function showExpenseDetail(expenseId) {
        const expense = expenses.find(e => e.id === expenseId);
        if (!expense) return;
        
        expenseModalContent.innerHTML = `
            <div class="detail-group">
                <label>Tanggal:</label>
                <p>${expense.tanggal}</p>
            </div>
            <div class="detail-group">
                <label>Keterangan:</label>
                <p>${expense.keterangan || '-'}</p>
            </div>
            <div class="detail-group">
                <label>Jumlah:</label>
                <p>${formatRupiah(expense.jumlah)}</p>
            </div>
            <div class="detail-group">
                <label>Catatan:</label>
                <p>${expense.catatan || '-'}</p>
            </div>
        `;
        
        expenseModal.classList.add('show');
    }
    
    function deletePayment(paymentId) {
        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4361ee',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                payments = payments.filter(p => p.id !== paymentId);
                savePayments();
                applyFiltersAndPagination();
                showSuccess('Data pembayaran telah dihapus.');
            }
        });
    }
    
    function deleteExpense(expenseId) {
        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4361ee',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                expenses = expenses.filter(e => e.id !== expenseId);
                saveExpenses();
                applyExpenseFiltersAndPagination();
                showSuccess('Data pengeluaran telah dihapus.');
            }
        });
    }
    
    function resetFilters() {
        filterTanggalInput.value = '';
        filterKelasInput.value = '';
        filterKeteranganInput.value = '';
        searchNamaInput.value = '';
        currentPage = 1;
        applyFiltersAndPagination();
    }
    
    function resetExpenseFilters() {
        expenseFilterTanggalInput.value = '';
        expenseSearchKeteranganInput.value = '';
        expenseCurrentPage = 1;
        applyExpenseFiltersAndPagination();
    }
    
    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            applyFiltersAndPagination();
        }
    }
    
    function goToNextPage() {
        const totalPages = Math.ceil(getFilteredAndSortedPayments().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            applyFiltersAndPagination();
        }
    }
    
    function goToExpensePrevPage() {
        if (expenseCurrentPage > 1) {
            expenseCurrentPage--;
            applyExpenseFiltersAndPagination();
        }
    }
    
    function goToExpenseNextPage() {
        const totalPages = Math.ceil(getFilteredAndSortedExpenses().length / itemsPerPage);
        if (expenseCurrentPage < totalPages) {
            expenseCurrentPage++;
            applyExpenseFiltersAndPagination();
        }
    }

    // Utility functions
    function showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: message,
            confirmButtonColor: '#4361ee',
            timer: 1500
        });
    }

    function showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonColor: '#4361ee'
        });
    }

    // Ekspor ke Excel (XLSX)
    window.exportToExcel = function(type) {
        if (typeof XLSX === 'undefined') {
            showError('Library XLSX (Excel) belum dimuat. Pastikan koneksi internet stabil.');
            return;
        }

        let dataForExport = [];
        let filename = '';
        let records = type === 'pemasukan' ? payments : expenses;
        
        if (records.length === 0) {
            showError(`Tidak ada data ${type} untuk diekspor!`);
            return;
        }

        if (type === 'pemasukan') {
            dataForExport = records.map(p => ({
                'Tanggal': p.tanggal,
                'Nama Siswa': p.namaSiswa || '',
                'Kelas': p.kelas || '',
                'Keterangan': p.keterangan || '',
                'Jumlah (Rp)': p.jumlah, 
                'Catatan': p.catatan || ''
            }));
            
            filename = `rekap_pembayaran_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (type === 'pengeluaran') {
            dataForExport = records.map(e => ({
                'Tanggal': e.tanggal,
                'Keterangan': e.keterangan || '',
                'Jumlah (Rp)': e.jumlah, 
                'Catatan': e.catatan || ''
            }));
            
            filename = `rekap_pengeluaran_${new Date().toISOString().split('T')[0]}.xlsx`;
        }
        
        const worksheet = XLSX.utils.json_to_sheet(dataForExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap');
        XLSX.writeFile(workbook, filename);
        
        showSuccess('Data berhasil diekspor ke Excel.');
    };

    // Ekspor ke PDF
    window.exportToPdf = function(type) {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            showError('Library jsPDF (PDF) belum dimuat. Pastikan koneksi internet stabil.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        let records = type === 'pemasukan' ? payments : expenses;
        let title = '';
        
        if (records.length === 0) {
            showError(`Tidak ada data ${type} untuk diekspor!`);
            return;
        }

        if (type === 'pemasukan') {
            title = 'REKAP PEMBAYARAN SISWA';
        } else if (type === 'pengeluaran') {
            title = 'REKAP PENGELUARAN';
        }
        
        // Add header
        pdf.setFontSize(16);
        pdf.text(title, 105, 15, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text(`Dibuat pada: ${new Date().toLocaleDateString('id-ID')}`, 105, 22, { align: 'center' });
        
        // Prepare table data
        const headers = type === 'pemasukan' 
            ? ['Tanggal', 'Nama Siswa', 'Kelas', 'Keterangan', 'Jumlah', 'Catatan']
            : ['Tanggal', 'Keterangan', 'Jumlah', 'Catatan'];
            
        const tableData = records.map(item => {
            if (type === 'pemasukan') {
                return [
                    item.tanggal,
                    item.namaSiswa || '-',
                    item.kelas || '-',
                    item.keterangan || '-',
                    formatRupiah(item.jumlah), 
                    item.catatan || '-'
                ];
            } else {
                return [
                    item.tanggal,
                    item.keterangan || '-',
                    formatRupiah(item.jumlah), 
                    item.catatan || '-'
                ];
            }
        });
        
        // Add summary
        const total = records.reduce((sum, item) => sum + item.jumlah, 0);
        pdf.text(`Total: ${formatRupiah(total)}`, 14, 30);
        
        // Create table
        pdf.autoTable({
            head: [headers],
            body: tableData,
            startY: 35,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [67, 97, 238] }
        });
        
        const filename = type === 'pemasukan' 
            ? `rekap_pembayaran_${new Date().toISOString().split('T')[0]}.pdf`
            : `rekap_pengeluaran_${new Date().toISOString().split('T')[0]}.pdf`;
            
        pdf.save(filename);
        showSuccess('Data berhasil diekspor ke PDF.');
    };

    // Reset data (Hapus data lama, kosongkan storage)
    window.resetAllData = function(type) {
        Swal.fire({
            title: `Yakin ingin reset semua data ${type}?`,
            text: "Semua data yang tersimpan akan dihapus permanen! Tindakan ini tidak dapat dibatalkan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Hapus Semua Data!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                if (type === 'pemasukan') {
                    payments = [];
                    localStorage.removeItem('payments'); 
                    applyFiltersAndPagination();
                    showSuccess('Semua data pembayaran telah dihapus. Storage kosong dan baru.');
                } else if (type === 'pengeluaran') {
                    expenses = [];
                    localStorage.removeItem('expenses'); 
                    applyExpenseFiltersAndPagination();
                    showSuccess('Semua data pengeluaran telah dihapus. Storage kosong dan baru.');
                }
                updateSummaryCards(); 
            }
        });
    };
});