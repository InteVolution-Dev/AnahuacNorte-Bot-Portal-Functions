// Mocks de los módulos externos
jest.mock("../foundry/foundryAgentManagerTool", () => ({
    getAgentByName: jest.fn(),
    buildOpenApiTool: jest.fn(),
    updateAgentDefinition: jest.fn(),
}));

jest.mock("../storage/storage", () => ({
    storeInTable: jest.fn(),
    getFromTable: jest.fn(),
}));

// Importar la función a testear y los mocks
const { patchFlow } = require("./patchFlow");
const {
    getAgentByName,
    buildOpenApiTool,
    updateAgentDefinition,
} = require("../foundry/foundryAgentManagerTool");
const { storeInTable, getFromTable } = require("../storage/storage");

describe("patchFlow", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Activar flujo", () => {
        it("debería registrar la herramienta OpenAPI al activar un flujo", async () => {
            const openApiJsonMock = {
                openapi: "3.0.3",
                info: {
                    title: "prueba_3",
                    description: "describe",
                    version: "1.0.0",
                },
                paths: {},
                components: {},
            };

            const agentMock = {
                versions: {
                    latest: {
                        definition: {
                            tools: [],
                        },
                    },
                },
            };

            getAgentByName.mockResolvedValue(agentMock);
            buildOpenApiTool.mockResolvedValue({
                type: "openapi",
                openapi: { name: openApiJsonMock.info.title },
            });
            updateAgentDefinition.mockResolvedValue({});
            storeInTable.mockResolvedValue({});
            getFromTable.mockResolvedValue({
                rowKey: "flow-123",
                payloadJson: JSON.stringify(openApiJsonMock),
                active: false,
            });

            const result = await patchFlow({
                storedFlowRowKey: "flow-123",
                active: true,
            });

            expect(getAgentByName).toHaveBeenCalledTimes(1);
            expect(buildOpenApiTool).toHaveBeenCalledTimes(1);
            expect(updateAgentDefinition).toHaveBeenCalledTimes(1);
            expect(storeInTable).toHaveBeenCalledTimes(1);

            expect(result).toEqual({
                id: "flow-123",
                active: true,
                updated: true,
            });
        });
    });

    describe("Desactivar flujo", () => {
        it("debería remover la herramienta OpenAPI al desactivar un flujo", async () => {
            const openApiJsonMock = {
                openapi: "3.0.3",
                info: {
                    title: "prueba_3",
                    description: "describe",
                    version: "1.0.0",
                },
                paths: {},
                components: {},
            };

            const agentMock = {
                versions: {
                    latest: {
                        definition: {
                            tools: [
                                {
                                    type: "openapi",
                                    openapi: { name: openApiJsonMock.info.title },
                                },
                            ],
                        },
                    },
                },
            };

            getAgentByName.mockResolvedValue(agentMock);
            updateAgentDefinition.mockResolvedValue({});
            storeInTable.mockResolvedValue({});
            getFromTable.mockResolvedValue({
                rowKey: "flow-456",
                payloadJson: JSON.stringify(openApiJsonMock),
                active: true,
            });

            const result = await patchFlow({
                storedFlowRowKey: "flow-456",
                active: false,
            });

            expect(getAgentByName).toHaveBeenCalledTimes(1);
            expect(updateAgentDefinition).toHaveBeenCalledTimes(1);
            expect(storeInTable).toHaveBeenCalledTimes(1);

            expect(result).toEqual({
                id: "flow-456",
                active: false,
                updated: true,
            });
        });
    });
});


/* 


// Test: Flow no existe al querer activar/desactivar
it("debería manejar el error cuando el flujo no existe al activar/desactivar", async () => {
});


// Test: Payload corrupto
it("debería manejar el error cuando el payloadJson es inválido", async () => {
});


// Test: Error de Foundry
it("debería manejar errores al interactuar con Foundry", async () => {
}); */
