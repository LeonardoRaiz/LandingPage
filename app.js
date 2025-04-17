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
            tentadoGerar: false
        };
    },
    computed: {
        totalSelecionados() {
            return Object.values(this.selecionados).reduce((acc, dia) => {
                return acc + Object.values(dia).filter(v => v).length;
            }, 0);
        },
        // Mínimo obrigatório: quantidade de períodos para cobrir a carga horária
        minimosObrigatorios() {
            return Math.ceil(this.cargaHoraria / 2);
        },
        // Recomendado com 50% extra
        disponibilidadeNecessaria() {
            return Math.ceil((this.cargaHoraria * 1.5) / 2);
        },
        // Só pode gerar PDF se atingir o mínimo obrigatório
        valido() {
            return this.totalSelecionados >= this.minimosObrigatorios;
        },
        // Para exibir mensagem de recomendação no PDF
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
            return Math.min(1, progresso); // máximo 100%
        }
    },
    methods: {
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

            setTimeout(() => {
                const element = document.getElementById("pdf-content");

                const opt = {
                    margin: 0.5,
                    filename: `disponibilidade_${this.professor.replace(/\s/g, '_')}.pdf`,
                    image: {type: 'jpeg', quality: 0.98},
                    html2canvas: {scale: 2},
                    jsPDF: {unit: 'in', format: 'a4', orientation: 'portrait'},
                    pagebreak: {mode: ['css', 'legacy']}
                };

                html2pdf().set(opt).from(element).save().then(() => {
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