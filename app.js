const { createApp } = Vue;

createApp({
    data() {
        const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const diasNoturno = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

        const periodosMatutino = [
            { label: '07:40-09:20', hora: '07:40 – 09:20' },
            { label: '09:30-11:10', hora: '09:30 – 11:10' },
            { label: '11:20-13:00', hora: '11:20 – 13:00' }
        ];

        const periodosNoturno = [
            { label: '19:00-20:40', hora: '19:00 – 20:40' },
            { label: '20:50-22:30', hora: '20:50 – 22:30' }
        ];

        const todosPeriodos = [...periodosMatutino, ...periodosNoturno];

        const selecionados = {};
        dias.forEach(dia => {
            selecionados[dia] = {};
            todosPeriodos.forEach(p => {
                selecionados[dia][p.label] = false;
            });
        });

        return {
            professor: '',
            cargaHoraria: 0,
            dias,
            diasNoturno,
            periodosMatutino,
            periodosNoturno,
            selecionados,
            tentadoGerar: false,
            assinaturaPad: null
        };
    },
    computed: {
        totalSelecionados() {
            return Object.values(this.selecionados).reduce((acc, dia) => {
                return acc + Object.values(dia).filter(v => v).length;
            }, 0);
        },
        minimosObrigatorios() {
            return Math.ceil(this.cargaHoraria / 2);
        },
        disponibilidadeNecessaria() {
            return Math.ceil((this.cargaHoraria * 1.5) / 2);
        },
        valido() {
            return this.totalSelecionados >= this.minimosObrigatorios;
        },
        atingiuRecomendado() {
            return this.totalSelecionados >= this.disponibilidadeNecessaria;
        },
        checkboxCores() {
            const marcados = [];

            this.dias.forEach(dia => {
                Object.entries(this.selecionados[dia]).forEach(([horario, marcado]) => {
                    if (marcado) {
                        marcados.push(`${dia}-${horario}`);
                    }
                });
            });

            const cores = {};
            const limite = this.disponibilidadeNecessaria;

            marcados.forEach((chave, index) => {
                cores[chave] = index < limite ? 'var(--primary)' : 'var(--primary-success)';
            });

            return cores;
        },
        barraProgresso() {
            const progresso = this.totalSelecionados / this.disponibilidadeNecessaria;
            return Math.min(1, progresso);
        }
    },
    watch: {
        professor() {
            this.initAssinatura();
        },
        cargaHoraria() {
            this.initAssinatura();
        }
    },
    methods: {
        initAssinatura() {
            this.$nextTick(() => {
                const canvas = document.getElementById("assinatura-canvas");
                if (canvas) {
                    const ratio = window.devicePixelRatio || 1;

                    const width = canvas.offsetWidth;
                    const height = canvas.offsetHeight;

                    canvas.width = width * ratio;
                    canvas.height = height * ratio;

                    const context = canvas.getContext("2d");
                    context.scale(ratio, ratio);

                    this.assinaturaPad = new SignaturePad(canvas, {
                        penColor: "rgb(0, 0, 0)"
                    });
                }
            });
        },
        limparAssinatura() {
            if (this.assinaturaPad) {
                this.assinaturaPad.clear();
            }
        },
        gerarPDF() {
            this.tentadoGerar = true;

            if (!this.valido) {
                Toastify({
                    text: "Você precisa selecionar pelo menos " + this.minimosObrigatorios + " períodos!",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc2626",
                }).showToast();
                return;
            }

            window.scrollTo(0, 0);

            const element = document.getElementById("pdf-content");
            const clone = element.cloneNode(true);


            const canvasClone = clone.querySelector("#assinatura-canvas");
            if (canvasClone) canvasClone.remove();

            const botoes = clone.querySelector(".assinatura-botoes");
            if (botoes) botoes.remove();

            if (this.assinaturaPad && !this.assinaturaPad.isEmpty()) {
                const assinaturaImg = this.assinaturaPad.toDataURL();
                const imgWrapper = document.createElement("div");
                imgWrapper.style.textAlign = "center";
                imgWrapper.style.marginTop = "2rem";

                const imgEl = document.createElement("img");
                imgEl.src = assinaturaImg;
                imgEl.alt = "Assinatura digital";
                imgEl.style.width = "400px";
                imgEl.style.maxWidth = "100%";
                imgEl.style.borderBottom = "1px solid #000";
                imgEl.style.paddingBottom = "0.5rem";

                const legenda = document.createElement("p");
                legenda.textContent = `Assinatura do Professor: ${this.professor}`;
                legenda.style.marginTop = "0.5rem";
                legenda.style.fontSize = "0.95rem";

                imgWrapper.appendChild(imgEl);
                imgWrapper.appendChild(legenda);
                clone.appendChild(imgWrapper);
            }

            setTimeout(() => {
                const opt = {
                    margin: 0.5,
                    filename: `disponibilidade_${this.professor.replace(/\s/g, '_')}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['css', 'legacy'] }
                };

                html2pdf().set(opt).from(clone).save().then(() => {
                    Toastify({
                        text: "PDF gerado com sucesso!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#059669",
                    }).showToast();
                });
            }, 300);
        }
    }
}).mount('#app');