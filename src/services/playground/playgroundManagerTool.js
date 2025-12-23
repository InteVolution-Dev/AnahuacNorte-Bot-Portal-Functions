// Azure SDK imports
const { OpenAI } = require("openai");
// Node.js imports


// CONSTANTES ==============================
const apiKey = process.env["FOUNDRY_MODEL_API_KEY"];
const endpoint = "https://IV-AnahuacMexico-dev-eus-foundry.openai.azure.com/openai/v1/";
const deploymentName = "gpt-5-chat";
// Configuración del cliente de Foundry y Table Storage
const openai = new OpenAI({
    baseURL: endpoint ,
    apiKey: apiKey
});



// FUNCIONES ==============================
// Función para crear un nuevo chat en el playground
async function createChat() {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "developer", content: "You are a helpful assistant." }],
        model: deploymentName,
        store: true,
    });

    console.log(`[DEBUG] Respuesta del servicio "${completion.choices[0]}" para la pregunta prueba`);
    const responseMessage = completion.choices[0].message;
    
    return {
        message: responseMessage,
        chatId: completion.id,
    };
}



module.exports = {
    createChat,
};
