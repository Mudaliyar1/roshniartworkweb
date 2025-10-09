// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initSidebarToggle();
    initTableEnhancements();
    initFormEnhancements();
    initImageGallery();
    initDeleteConfirmations();
    initTooltips();
    initUploadLoaders();
});

// Sidebar toggle functionality
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainContent = document.getElementById('mainContent');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
            document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        });
    }

    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Close sidebar when clicking on nav links (mobile)
    const navLinks = sidebar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 992) {
                sidebar.classList.remove('show');
                sidebarOverlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 992) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
}

// Table enhancements
function initTableEnhancements() {
    // Add hover effects and sorting capabilities
    const tables = document.querySelectorAll('.table-admin');
    
    tables.forEach(table => {
        // Add sorting to table headers
        const headers = table.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                sortTable(table, this.dataset.sort);
            });
        });

        // Add row selection
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.addEventListener('click', function(e) {
                if (!e.target.closest('.action-buttons')) {
                    this.classList.toggle('selected');
                }
            });
        });
    });
}

// Form enhancements
function initFormEnhancements() {
    // Add floating labels effect
    const formControls = document.querySelectorAll('.form-control-admin');
    
    formControls.forEach(control => {
        control.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        control.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if field has value on load
        if (control.value) {
            control.parentElement.classList.add('focused');
        }
    });

    // File upload enhancements
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const files = this.files;
            const label = this.nextElementSibling || this.parentElement.querySelector('label');
            
            if (files.length > 0) {
                label.textContent = files.length === 1 ? files[0].name : `${files.length} files selected`;
                label.classList.add('file-selected');
            }
        });
    });
}

// Image gallery for artwork forms
function initImageGallery() {
    const imageContainer = document.getElementById('imageContainer');
    if (!imageContainer) return;

    const images = imageContainer.querySelectorAll('.card');
    images.forEach(image => {
        image.addEventListener('click', function() {
            // Remove active class from all images
            images.forEach(img => img.classList.remove('border-primary'));
            
            // Add active class to clicked image
            this.classList.add('border-primary');
            
            // Update hidden input if exists
            const hiddenInput = document.getElementById('mainImageInput');
            if (hiddenInput) {
                hiddenInput.value = this.dataset.imageId;
            }
        });
    });

    // Image preview for new uploads
    const imageInput = document.getElementById('images');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            const files = this.files;
            const previewContainer = document.getElementById('imagePreview');
            
            if (previewContainer) {
                previewContainer.innerHTML = '';
                
                Array.from(files).forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const previewDiv = document.createElement('div');
                            previewDiv.className = 'col-md-3 mb-3';
                            previewDiv.innerHTML = `
                                <div class="card">
                                    <img src="${e.target.result}" class="card-img-top" style="height: 150px; object-fit: cover;">
                                    <div class="card-body p-2">
                                        <small class="text-muted">${file.name}</small>
                                    </div>
                                </div>
                            `;
                            previewContainer.appendChild(previewDiv);
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        });
    }
}

// Delete confirmations
function initDeleteConfirmations() {
    const deleteButtons = document.querySelectorAll('.btn-delete, [data-action="delete"]');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const itemName = this.dataset.itemName || 'this item';
            const deleteUrl = this.href || this.dataset.url;
            
            if (confirm(`Are you absolutely sure you want to delete ${itemName}? This action cannot be undone.`)) {
                if (this.tagName === 'A') {
                    window.location.href = deleteUrl;
                } else {
                    // Handle form submission
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = deleteUrl;
                    
                    const methodInput = document.createElement('input');
                    methodInput.type = 'hidden';
                    methodInput.name = '_method';
                    methodInput.value = 'DELETE';
                    form.appendChild(methodInput);
                    
                    document.body.appendChild(form);
                    form.submit();
                }
            }
        });
    });
}

// Initialize tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Table sorting function
function sortTable(table, column) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(table.querySelectorAll('th')).findIndex(th => th.dataset.sort === column);
    
    if (columnIndex === -1) return;
    
    const sortOrder = table.dataset.sortOrder === 'asc' ? 'desc' : 'asc';
    table.dataset.sortOrder = sortOrder;
    
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        // Check if values are numbers
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
    
    // Clear tbody and append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    
    // Update sort indicators
    const headers = table.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (header.dataset.sort === column) {
            header.classList.add(`sort-${sortOrder}`);
        }
    });
}

// Statistics animation
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        let currentValue = 0;
        const increment = Math.ceil(finalValue / 50);
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                stat.textContent = finalValue;
                clearInterval(timer);
            } else {
                stat.textContent = currentValue;
            }
        }, 50);
    });
}

// Initialize stats animation when visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            statsObserver.disconnect();
        }
    });
});

const statsContainer = document.querySelector('.quick-actions');
if (statsContainer) {
    statsObserver.observe(statsContainer);
}

// Auto-save functionality for forms
function initAutoSave() {
    const forms = document.querySelectorAll('form[data-autosave]');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(function() {
                saveFormData(form);
            }, 1000));
        });
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Save form data to localStorage
function saveFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem(`form_${form.id}`, JSON.stringify(data));
    
    // Show save indicator
    showSaveIndicator();
}

// Show save indicator
function showSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.innerHTML = '<i class="bi bi-check-circle-fill"></i> Saved';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--admin-purple-gradient);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9rem;
        z-index: 1050;
        animation: slideInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.remove();
    }, 2000);
}

// Add CSS animation for save indicator
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInOut {
        0% { transform: translateX(100%); opacity: 0; }
        20%, 80% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
    }
    
    .table-admin th.sort-asc::after {
        content: ' ↑';
        color: var(--admin-primary);
    }
    
    .table-admin th.sort-desc::after {
        content: ' ↓';
        color: var(--admin-primary);
    }
    
    .table-admin tbody tr.selected {
        background: rgba(217, 70, 239, 0.1) !important;
    }
    
    .file-selected {
        color: var(--admin-primary) !important;
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// Initialize auto-save
initAutoSave();

// Initialize upload loaders
function initUploadLoaders() {
    // Handle image uploads
    const imageInput = document.getElementById('images');
    const videoInput = document.getElementById('videoFile');
    const submitBtn = document.getElementById('submitArtworkBtn');
    const uploadOverlay = document.getElementById('uploadProgressOverlay');
    const progressBar = document.getElementById('uploadProgressBar');
    
    // Handle form submission to show loading indicators
    const artworkForm = document.querySelector('form[enctype="multipart/form-data"]');
    if (artworkForm && submitBtn && uploadOverlay) {
        artworkForm.addEventListener('submit', function(e) {
            // Check if there are files to upload
            const hasImageFiles = imageInput && imageInput.files.length > 0;
            const hasVideoFile = videoInput && videoInput.files.length > 0 && 
                document.getElementById('videoTypeFile') && 
                document.getElementById('videoTypeFile').checked;
                
            if (hasImageFiles || hasVideoFile) {
                e.preventDefault(); // Prevent default form submission
                
                // Show the upload overlay
                uploadOverlay.classList.remove('d-none');
                
                // Simulate upload progress (in a real app, you would use XMLHttpRequest or Fetch API with progress events)
                let progress = 0;
                const interval = setInterval(function() {
                    progress += Math.random() * 10;
                    if (progress > 100) progress = 100;
                    
                    const percentage = Math.round(progress);
                    progressBar.style.width = percentage + '%';
                    progressBar.setAttribute('aria-valuenow', percentage);
                    progressBar.textContent = percentage + '%';
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                        // Submit the form after "upload" is complete
                        setTimeout(function() {
                            artworkForm.submit();
                        }, 500);
                    }
                }, 500);
            }
        });
    }
}