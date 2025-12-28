
# Gugu esta conta faz tu!! 🧠 (Ollama Version)

Uma aplicação interativa desenvolvida para ajudar crianças a dominar a subtração utilizando o **Método de Decomposição**, agora alimentada localmente via **Ollama**.

## Funcionalidades
- **Ollama AI**: Usa modelos locais (llama3.2 e llava) para gerar exercícios e analisar fotos.
- **Grátis e Ilimitado**: Sem quotas de API externas.
- **Análise de Papel**: Tira uma foto da tua conta no papel e a IA preenche os passos.

## Requisitos para Funcionamento Local
Como esta app corre no browser (GitHub Pages), precisas de configurar o Ollama para permitir pedidos (CORS):

1. **Fecha o Ollama** se estiver a correr.
2. Abre o teu terminal ou linha de comandos.
3. Executa o Ollama com estas permissões:
   - **Windows (PowerShell):** `$env:OLLAMA_ORIGINS="*"; ollama serve`
   - **Mac/Linux:** `OLLAMA_ORIGINS="*" ollama serve`
4. Garante que tens os modelos instalados:
   - `ollama pull llama3.2`
   - `ollama pull llava`

## Como Jogar
1. Abre a aplicação.
2. Se o Ollama estiver bem configurado, um novo problema aparecerá.
3. Resolve os passos (Centenas, Dezenas, Unidades).
4. Ou tira uma foto do teu caderno para a IA verificar por ti!
