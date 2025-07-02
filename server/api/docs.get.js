/**
 * API Documentation Endpoint
 * Serves OpenAPI specification and interactive documentation
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

export default defineEventHandler(async (event) => {
  const { req } = event.node;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const format = url.searchParams.get('format') || 'json';

  try {
    // Chemin vers le fichier OpenAPI
    const openApiPath = join(process.cwd(), 'docs/api/openapi.yaml');
    const yamlContent = readFileSync(openApiPath, 'utf8');
    
    // Parser le YAML
    const openApiSpec = YAML.parse(yamlContent);
    
    // Mettre à jour l'URL du serveur selon l'environnement
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://smi-corporation.com/api'
      : `http://${req.headers.host}/api`;
    
    openApiSpec.servers = [
      {
        url: baseUrl,
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ];

    // Répondre selon le format demandé
    if (format === 'yaml') {
      setHeader(event, 'Content-Type', 'application/x-yaml');
      return YAML.stringify(openApiSpec);
    } else {
      setHeader(event, 'Content-Type', 'application/json');
      return openApiSpec;
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load API documentation',
      data: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});