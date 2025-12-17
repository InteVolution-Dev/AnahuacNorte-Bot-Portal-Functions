// Mocks de los módulos externos
jest.mock("../foundry/foundryAgentManagerTool", () => ({
    getFoundryAgent: jest.fn(),
    registerOpenAPITool: jest.fn(),
    deleteOpenAPITool: jest.fn(),
}));

jest.mock("../storage/storage", () => ({
    storeInTable: jest.fn(),
    getFromTable: jest.fn(),
}));



// Importar la función a testear y los mocks
const { patchFlow } = require("./patchFlow");
const {
    getFoundryAgent,
    registerOpenAPITool,
    deleteOpenAPITool
} = require("../foundry/foundryAgentManagerTool");
const { 
    storeInTable,
    getFromTable
} = require("../storage/storage");



// Tests para la función patchFlow
describe("patchFlow", () => {
    // Test: Activar un flujo correctamente
    describe("Activar flujo", () => {

        beforeEach(() => {
            jest.clearAllMocks();
        })

        it("debería registrar la herramienta OpenAPI al activar un flujo", async () => {
            // ----------- GIVEN -----------
            const agentMock = {
                id: "agent-test"
            }

            const storedFlowMock = {
                partitionKey: "flows",
                rowKey: "flow-123",
                timeStamp: "2024-01-01T00:00:00Z",
                active: true,
                baseUrl: "https://api.example.com",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
                description: "Test Flow descripcion",
                payloadJson: JSON.stringify({"openapi":"3.0.3","info":{"title":"prueba_3","description":"describe","version":"1.0.0"},"servers":[{"url":"http://localhost:5173/flows"}],"paths":{"/ruta/{id}":{"get":{"summary":"ruta","description":"","operationId":"ruta_uniquefhvnnm","parameters":[{"name":"id","in":"path","required":true,"description":"es identificador","schema":{"type":"string","example":"1"}}],"responses":{"200":{"description":"La petición se realizó correctamente","content":{"application/json":{"schema":{"type":"object"}}}}}}}},"components":{}})
            };

            const openApiJsonMock = JSON.parse(storedFlowMock.payloadJson);

            const bodyMock = {
                storedFlowRowKey: "flow-123",
                active: true
            }

            getFromTable.mockResolvedValue(storedFlowMock);
            getFoundryAgent.mockResolvedValue(agentMock);
            registerOpenAPITool.mockResolvedValue({
                id: agentMock.id,
                tools: [  // aquí solo estoy poniendo lo mínimo, al final el agente que regresa no se usa para nada, solo para un log
                    { type: "openapi", openapi: { name: openApiJsonMock.info.title } }
                ]
            });
            storeInTable.mockResolvedValue({}); // Mock para evitar errores al guardar

            // ----------- WHEN -----------
            const result = await patchFlow(bodyMock);

            // ---------- THEN ----------
            expect(getFoundryAgent).toHaveBeenCalledTimes(1);

            expect(registerOpenAPITool).toHaveBeenCalledTimes(1);
            expect(registerOpenAPITool).toHaveBeenCalledWith(
                agentMock,
                openApiJsonMock  // ya parseado arriba
            );

            expect(storeInTable).toHaveBeenCalledTimes(1);
            expect(storeInTable).toHaveBeenCalledWith(
                expect.objectContaining({
                    mode: "merge"
                })
            );

            expect(result).toEqual({
                id: "flow-123",
                active: true,
                updated: true
            });
        });
    });
});



/* // Test: Desactivar un flujo correctamente
it("debería eliminar la herramienta OpenAPI al desactivar un flujo", async () => {
});


// Test: Flow no existe al querer activar/desactivar
it("debería manejar el error cuando el flujo no existe al activar/desactivar", async () => {
});


// Test: Payload corrupto
it("debería manejar el error cuando el payloadJson es inválido", async () => {
});


// Test: Error de Foundry
it("debería manejar errores al interactuar con Foundry", async () => {
}); */
