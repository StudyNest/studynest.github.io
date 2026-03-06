const app = {
    state: { 
        layout: 'cornell', pattern: 'bg-lined', font: 'font-sans', orientation: 'portrait', pageCount: 0, 
        recentColors: [], 
        customText: null, 
        customHilite: null 
    },
    savedSelection: null,
    activePickerMode: 'foreColor',
    pendingReset: null,
    pendingTemplate: null,

    init() { 
        if(!this.loadState()) {
            this.addPage(); 
        }
        document.getElementById('workspace').addEventListener('input', () => this.saveState());
        this.renderRecentColors();
        this.updateCustomBoxes();

        window.onbeforeunload = function() {
            return "You have unsaved changes. Please export to PDF before leaving.";
        };

        // Intercept CTRL+P
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.confirmPrint();
            }
        });

        // Update Toolbar State (Bold/Italic/Underline)
        document.addEventListener('selectionchange', () => this.updateToolbarState());
    },

    updateToolbarState() {
        const tools = ['bold', 'italic', 'underline'];
        tools.forEach(tool => {
            const isActive = document.queryCommandState(tool);
            const btn = document.getElementById(`btn-${tool}`);
            if(btn) {
                if(isActive) btn.classList.add('active-tool');
                else btn.classList.remove('active-tool');
            }
        });
    },

    // --- Modal Management ---
    closeModals() {
        document.getElementById('color-modal').classList.remove('show');
        document.getElementById('print-dialog').classList.remove('show');
        document.getElementById('reset-dialog').classList.remove('show');
        document.getElementById('modal-overlay').classList.remove('show');
    },

    confirmPrint() {
        this.closeModals(); // Close others
        document.getElementById('modal-overlay').classList.add('show');
        document.getElementById('print-dialog').classList.add('show');
    },

    triggerSystemPrint() {
        this.closeModals();
        setTimeout(() => window.print(), 100);
    },

    // --- Reset Logic ---
    triggerReset(type, templateName = null) {
        this.closeModals();
        this.pendingReset = type;
        this.pendingTemplate = templateName;
        document.getElementById('modal-overlay').classList.add('show');
        document.getElementById('reset-dialog').classList.add('show');
    },

    executeReset() {
        this.closeModals();
        
        // If reset triggered by template change
        if (this.pendingReset === 'template' && this.pendingTemplate) {
            this.state.layout = this.pendingTemplate;
        }

        // Perform Wipe
        localStorage.removeItem('notesmith_v4_data');
        document.getElementById('pages').innerHTML = ''; 
        this.state.pageCount = 0; 
        this.state.recentColors = [];
        this.state.customText = null;
        this.state.customHilite = null;
        this.addPage(); 

        // Clear pending
        this.pendingReset = null;
        this.pendingTemplate = null;
    },

    // --- Selection & Colors ---
    saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            this.savedSelection = sel.getRangeAt(0);
        }
    },

    restoreSelection() {
        if (this.savedSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.savedSelection);
        }
    },

    formatText(command, value) {
        document.execCommand(command, false, value);
    },

    openPicker(mode) {
        this.saveSelection();
        this.activePickerMode = mode;
        this.closeModals();
        document.getElementById('color-modal').classList.add('show');
        const modal = document.getElementById('color-modal');
        modal.style.left = '50%';
    },

    applyCustomColor() {
        const color = document.getElementById('modal-picker-input').value;
        this.restoreSelection();
        this.formatText(this.activePickerMode, color);
        
        if (this.activePickerMode === 'foreColor') this.state.customText = color;
        if (this.activePickerMode === 'hiliteColor') this.state.customHilite = color;
        
        this.addToRecent(color);
        this.updateCustomBoxes();
        this.closeModals();
    },

    applyLastCustom(mode) {
        const color = (mode === 'foreColor') ? this.state.customText : this.state.customHilite;
        if (color) {
            this.saveSelection(); 
            this.formatText(mode, color);
        } else {
            this.openPicker(mode); 
        }
    },

    updateCustomBoxes() {
        const textBox = document.getElementById('btn-custom-text');
        const hiliteBox = document.getElementById('btn-custom-hilite');
        
        if (this.state.customText) {
            textBox.style.backgroundColor = this.state.customText;
            textBox.style.border = "1px solid rgba(255,255,255,0.3)";
        }
        if (this.state.customHilite) {
            hiliteBox.style.backgroundColor = this.state.customHilite;
            hiliteBox.style.border = "1px solid rgba(255,255,255,0.3)";
        }
    },

    addToRecent(color) {
        this.state.recentColors = this.state.recentColors.filter(c => c !== color);
        this.state.recentColors.unshift(color);
        if(this.state.recentColors.length > 5) this.state.recentColors.pop();
        
        this.renderRecentColors();
        this.saveState();
    },

    renderRecentColors() {
        const container = document.getElementById('recent-colors-list');
        container.innerHTML = '';
        this.state.recentColors.forEach(color => {
            const d = document.createElement('div');
            d.className = 'recent-swatch';
            d.style.backgroundColor = color;
            d.title = color;
            d.onmousedown = (e) => {
                e.preventDefault();
                this.restoreSelection();
                this.formatText(this.activePickerMode, color);
                
                if (this.activePickerMode === 'foreColor') this.state.customText = color;
                if (this.activePickerMode === 'hiliteColor') this.state.customHilite = color;
                this.updateCustomBoxes();
                
                this.closeModals();
                this.addToRecent(color);
            };
            container.appendChild(d);
        });
    },

    // --- State Management ---
    saveState() {
        const data = {
            state: this.state,
            html: document.getElementById('pages').innerHTML,
            structureColor: document.documentElement.style.getPropertyValue('--paper-line-color')
        };
        localStorage.setItem('notesmith_v4_data', JSON.stringify(data));
    },

    loadState() {
        const saved = localStorage.getItem('notesmith_v4_data');
        if (!saved) return false;
        
        try {
            const data = JSON.parse(saved);
            this.state = data.state;
            if(!this.state.recentColors) this.state.recentColors = [];
            
            document.getElementById('pages').innerHTML = data.html;
            if(data.structureColor) this.setStructureColor(data.structureColor, null);
            
            this.updateSidebarUI();
            this.setOrientation(this.state.orientation);
            this.renderRecentColors();
            this.updateCustomBoxes();
            
            document.querySelectorAll('.a4-page').forEach(page => {
                this.attachOverflowGuard(page);
                page.querySelectorAll('.rigid-editor').forEach(ed => {
                    // Recover rows from attribute or default
                    if(!ed.getAttribute('data-rows')) ed.setAttribute('data-rows', '20');
                    this.updateLinePhysics(ed);
                });
                const delBtn = page.querySelector('.fa-trash')?.parentElement;
                if(delBtn) delBtn.onclick = () => { page.remove(); this.saveState(); };
                
                const dateDiv = page.querySelector('.page-header .text-right');
                if(dateDiv && !dateDiv.getAttribute('contenteditable')) {
                    dateDiv.setAttribute('contenteditable', 'true');
                    dateDiv.className = "text-right text-sm opacity-60 outline-none";
                }
            });

            document.querySelectorAll('.case-box .bg-red-800').forEach(btn => {
                btn.onclick = () => { btn.closest('.case-box').remove(); this.saveState(); }
            });

            return true;
        } catch(e) { return false; }
    },

    updateSidebarUI() {
        document.querySelectorAll('.layout-card').forEach(el => el.classList.remove('active'));
        const layoutCard = document.getElementById(`card-${this.state.layout}`);
        if(layoutCard) layoutCard.classList.add('active');

        ['bg-lined', 'bg-grid', 'bg-plain'].forEach(p => {
            const el = document.getElementById(p.replace('bg', 'pat'));
            if(el) {
                if(p === this.state.pattern) el.classList.add('active'); else el.classList.remove('active');
            }
        });

        ['font-sans', 'font-serif', 'font-hand'].forEach(f => {
            const el = document.getElementById(f);
            if(f === this.state.font) el.classList.add('active'); else el.classList.remove('active');
        });
    },

    createEditor(initialRows = 20) {
        const wrapper = document.createElement('div');
        wrapper.className = 'container-wrapper';
        wrapper.innerHTML = `
            <div class="section-controls">
                <span class="ctrl-label">ROWS:</span>
                <button class="ctrl-btn" onclick="app.adjustRows(this, -1)">-</button>
                <span class="row-count">${initialRows}</span>
                <button class="ctrl-btn" onclick="app.adjustRows(this, 1)">+</button>
            </div>
            <div class="rigid-editor" contenteditable="true" spellcheck="false" data-rows="${initialRows}"></div>
        `;
        setTimeout(() => this.updateLinePhysics(wrapper.querySelector('.rigid-editor')), 0);
        return wrapper;
    },

    getLayoutHTML() {
        const date = new Date().toLocaleDateString();
        const headerHTML = `
            <div class="page-header">
                <div class="w-3/4">
                    <div contenteditable="true" class="text-4xl font-bold outline-none mb-1" placeholder="Title: "></div>
                    <div contenteditable="true" class="text-lg opacity-70 outline-none" placeholder="Sub-Title: "></div>
                </div>
                <div contenteditable="true" class="text-right text-sm opacity-60 outline-none">${date}</div>
            </div>
        `;
        if (this.state.layout === 'cornell') {
            return `${headerHTML}<div class="cornell-body"><div class="cornell-left" id="zone-cues"><div class="text-xs font-bold uppercase tracking-widest opacity-50 mb-1 select-none">Cues</div></div><div class="cornell-right" id="zone-notes"><div class="text-xs font-bold uppercase tracking-widest opacity-50 mb-1 select-none">Notes</div></div></div><div class="cornell-footer" id="zone-summary"><div class="text-xs font-bold uppercase tracking-widest opacity-50 mb-1 select-none">Summary</div></div>`;
        } else if (this.state.layout === 'case') {
            return `${headerHTML}<div class="no-print mb-2 text-right"><button onclick="app.addCaseBox(this)" class="px-2 py-1 bg-slate-200 rounded text-xs text-slate-800 font-bold hover:bg-indigo-200">+ Add Box</button></div><div class="case-grid"></div>`;
        } else {
            return `${headerHTML}<div class="flex-1 flex flex-col" id="zone-blank"></div>`;
        }
    },

    addPage() {
        this.state.pageCount++;
        const container = document.getElementById('pages');
        const page = document.createElement('div');
        page.className = `a4-page ${this.state.pattern} ${this.state.font} ${this.state.orientation}`;
        page.id = `page-${this.state.pageCount}`;
        page.innerHTML = this.getLayoutHTML();

        if(this.state.pageCount > 1 || document.querySelectorAll('.a4-page').length > 0) {
            const btn = document.createElement('button');
            btn.className = 'no-print absolute top-2 -right-10 text-red-400 hover:text-red-600';
            btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            btn.onclick = () => { page.remove(); this.saveState(); };
            page.appendChild(btn);
        }

        container.appendChild(page);

        if (this.state.layout === 'cornell') {
            page.querySelector('#zone-cues').appendChild(this.createEditor(20)); 
            page.querySelector('#zone-notes').appendChild(this.createEditor(20));
            page.querySelector('#zone-summary').appendChild(this.createEditor(8)); 
        } else if (this.state.layout === 'case') {
            const grid = page.querySelector('.case-grid');
            this.appendCaseBox(grid, 'Placeholder', 'w-half', 'h-med');
            this.appendCaseBox(grid, 'Placeholder', 'w-half', 'h-med');
            this.appendCaseBox(grid, 'Placeholder', 'w-full', 'h-med');
        } else {
                const zone = page.querySelector('#zone-blank');
                if(zone) zone.appendChild(this.createEditor(32));
        }
        this.attachOverflowGuard(page);
        this.updateSidebarUI();
        this.saveState();
    },

    addCaseBox(btn) {
        const grid = btn.closest('.a4-page').querySelector('.case-grid');
        this.appendCaseBox(grid, 'New Section', 'w-half', 'h-small');
    },

    appendCaseBox(grid, title, widthClass, heightClass) {
        const box = document.createElement('div');
        box.className = `case-box ${widthClass} ${heightClass}`;
        box.innerHTML = `
            <div class="case-box-header">
                <div contenteditable="true" class="font-bold text-xs uppercase outline-none">${title}</div>
                <div class="section-controls">
                        <span class="ctrl-label">SIZE:</span>
                        <button class="ctrl-btn" onclick="app.toggleWidth(this)">W</button>
                        <button class="ctrl-btn" onclick="app.toggleHeight(this)">H</button>
                        <div class="w-px h-3 bg-slate-300 mx-1 self-center"></div>
                        <span class="ctrl-label">ROWS:</span>
                        <button class="ctrl-btn" onclick="app.adjustRows(this, -1)">-</button>
                        <span class="row-count">10</span>
                        <button class="ctrl-btn" onclick="app.adjustRows(this, 1)">+</button>
                        <button class="ctrl-btn bg-red-800 hover:bg-red-600 ml-1 text-white border-red-900" onclick="this.closest('.case-box').remove(); app.saveState();">X</button>
                </div>
            </div>
            <div class="container-wrapper p-1">
                <div class="rigid-editor h-full" contenteditable="true" data-rows="10"></div>
            </div>
        `;
        grid.appendChild(box);
        
        if (grid.scrollHeight > grid.clientHeight) {
            box.remove();
            alert("Page is full!");
        } else {
            setTimeout(() => this.updateLinePhysics(box.querySelector('.rigid-editor')), 0);
            this.saveState();
        }
    },

    toggleWidth(btn) {
        const box = btn.closest('.case-box');
        const grid = box.parentElement;
        const oldClass = box.classList.contains('w-half') ? 'w-half' : 'w-full';
        const newClass = oldClass === 'w-half' ? 'w-full' : 'w-half';
        box.classList.replace(oldClass, newClass);
        if (grid.scrollHeight > grid.clientHeight) {
            box.classList.replace(newClass, oldClass);
            alert("Not enough horizontal space.");
        } else {
            this.updateLinePhysics(box.querySelector('.rigid-editor'));
            this.saveState();
        }
    },

    toggleHeight(btn) {
        const box = btn.closest('.case-box');
        const grid = box.parentElement;
        let oldClass, newClass;
        if (box.classList.contains('h-small')) { oldClass = 'h-small'; newClass = 'h-med'; }
        else if (box.classList.contains('h-med')) { oldClass = 'h-med'; newClass = 'h-tall'; }
        else { oldClass = 'h-tall'; newClass = 'h-small'; }

        box.classList.remove(oldClass);
        box.classList.add(newClass);

        if (grid.scrollHeight > grid.clientHeight) {
            box.classList.remove(newClass);
            box.classList.add(oldClass); 
            alert("Not enough vertical space.");
        } else {
            this.updateLinePhysics(box.querySelector('.rigid-editor'));
            this.saveState();
        }
    },

    adjustRows(btn, delta) {
        let wrapper = btn.closest('.container-wrapper'); 
        let containerDiv = wrapper;
        
        // Handling Case Box logic
        if(!wrapper) {
            const box = btn.closest('.case-box');
            wrapper = box.querySelector('.container-wrapper');
            containerDiv = btn.parentElement; 
        } else {
            containerDiv = wrapper.querySelector('.section-controls');
        }

        const editor = wrapper.querySelector('.rigid-editor');
        let current = parseInt(editor.getAttribute('data-rows'));
        let next = current + delta;
        if (next < 2) next = 2;
        if (next > 60) next = 60;
        
        editor.setAttribute('data-rows', next);
        
        const display = containerDiv.querySelector('.row-count');
        if(display) display.innerText = next;

        this.updateLinePhysics(editor);
        this.saveState();
    },

    updateLinePhysics(editor) {
        const height = editor.clientHeight;
        const rows = parseInt(editor.getAttribute('data-rows'));
        const rowHeight = height / rows;
        editor.style.lineHeight = `${rowHeight}px`;
        editor.style.fontSize = `${rowHeight * 0.80}px`;
        
        if (this.state.pattern === 'bg-grid') {
            // Grid logic skipped
        } else {
            editor.style.backgroundSize = `100% ${rowHeight}px`;
        }
        
        editor.style.paddingBottom = "5px"; 
    },

    attachOverflowGuard(pageElement) {
        const editors = pageElement.querySelectorAll('.rigid-editor');
        
        editors.forEach(el => {
            if (!el.dataset.savedHtml) {
                el.dataset.savedHtml = el.innerHTML;
            }

            el.addEventListener('focus', () => {
                el.dataset.savedHtml = el.innerHTML;
            });

            el.addEventListener('input', (e) => {
                if (el.scrollHeight > el.clientHeight) {
                    this.flashError(el);
                    el.innerHTML = el.dataset.savedHtml;
                    this.placeCaretAtEnd(el);
                } else {
                    el.dataset.savedHtml = el.innerHTML;
                }
            });
        });

        window.addEventListener('resize', () => {
            document.querySelectorAll('.rigid-editor').forEach(el => this.updateLinePhysics(el)); 
        });
    },

    placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    },

    flashError(el) {
        el.classList.add('flash-error');
        setTimeout(() => el.classList.remove('flash-error'), 200);
    },

    setTemplate(t) { 
        this.triggerReset('template', t);
    },
    
    setPattern(p) { 
        this.state.pattern = p; 
        document.querySelectorAll('.a4-page').forEach(el => { el.classList.remove('bg-plain', 'bg-lined', 'bg-grid'); el.classList.add(p); }); 
        document.querySelectorAll('.rigid-editor').forEach(ed => this.updateLinePhysics(ed));
        this.updateSidebarUI();
        this.saveState();
    },
    
    setFont(f) { 
        this.state.font = f; 
        document.querySelectorAll('.a4-page').forEach(el => { el.classList.remove('font-sans', 'font-serif', 'font-hand'); el.classList.add(f); }); 
        this.updateSidebarUI();
        this.saveState();
    },
    
    setStructureColor(color, btn) {
        document.documentElement.style.setProperty('--paper-line-color', color);
        document.querySelectorAll('.color-swatch, .struct-picker-label').forEach(el => el.classList.remove('active'));
        
        if(btn) {
            if(btn.tagName === 'LABEL') {
                btn.classList.add('active');
                btn.style.borderColor = color;
                btn.style.color = color;
            } else {
                btn.classList.add('active');
            }
        }
        this.saveState();
    },

    setOrientation(o) {
        this.state.orientation = o;
        const styleEl = document.getElementById('print-orientation-style');
        const btnP = document.getElementById('btn-portrait');
        const btnL = document.getElementById('btn-landscape');
        
        if (o === 'landscape') {
            styleEl.innerHTML = '@page { size: landscape; margin: 0; }';
            btnL.className = "px-3 py-1 rounded text-xs font-medium text-white bg-[var(--accent-color)]";
            btnP.className = "px-3 py-1 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-white";
        } else {
            styleEl.innerHTML = '@page { size: portrait; margin: 0; }';
            btnP.className = "px-3 py-1 rounded text-xs font-medium text-white bg-[var(--accent-color)]";
            btnL.className = "px-3 py-1 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-white";
        }
        document.querySelectorAll('.a4-page').forEach(el => {
            if(o === 'landscape') el.classList.add('landscape'); else el.classList.remove('landscape');
            setTimeout(() => { el.querySelectorAll('.rigid-editor').forEach(ed => this.updateLinePhysics(ed)); }, 100);
        });
        this.saveState();
    },
    
    reset() { 
        this.triggerReset('full');
    }
};

// INITIALIZE APP
// Make sure app is available globally for inline HTML click handlers
window.app = app;
app.init();