#!/usr/bin/env tsx

/**
 * Script para testar a performance das APIs
 * Execute com: npm run test:performance
 */

import { performance } from 'perf_hooks';

interface PerformanceResult {
  endpoint: string;
  method: string;
  duration: number;
  cacheStatus: string;
  responseSize: number;
  timestamp: string;
}

class APIPerformanceTester {
  private baseUrl: string;
  private results: PerformanceResult[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<PerformanceResult> {
    const start = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const end = performance.now();
      const duration = end - start;
      
      const responseText = await response.text();
      const responseSize = responseText.length;
      
      const cacheStatus = response.headers.get('X-Cache') || 'UNKNOWN';
      const cacheTTL = response.headers.get('X-Cache-TTL');
      const etag = response.headers.get('ETag');
      
      console.log(`✅ ${method} ${endpoint}`);
      console.log(`   Tempo: ${duration.toFixed(2)}ms`);
      console.log(`   Cache: ${cacheStatus}${cacheTTL ? ` (TTL: ${cacheTTL})` : ''}`);
      console.log(`   ETag: ${etag || 'N/A'}`);
      console.log(`   Tamanho: ${(responseSize / 1024).toFixed(2)}KB`);
      console.log('');

      return {
        endpoint,
        method,
        duration,
        cacheStatus,
        responseSize,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      
      console.log(`❌ ${method} ${endpoint} - Erro: ${error}`);
      console.log(`   Tempo: ${duration.toFixed(2)}ms`);
      console.log('');

      return {
        endpoint,
        method,
        duration,
        cacheStatus: 'ERROR',
        responseSize: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async testCacheBehavior(endpoint: string): Promise<void> {
    console.log(`🔄 Testando comportamento de cache para ${endpoint}`);
    console.log('=' .repeat(50));

    // Primeira requisição (deve ser MISS)
    console.log('📥 Primeira requisição (esperado: MISS)');
    const firstRequest = await this.makeRequest(endpoint);
    this.results.push(firstRequest);

    // Segunda requisição (deve ser HIT se cache funcionar)
    console.log('📥 Segunda requisição (esperado: HIT)');
    const secondRequest = await this.makeRequest(endpoint);
    this.results.push(secondRequest);

    // Terceira requisição com no-cache (deve forçar refresh)
    console.log('📥 Terceira requisição com no-cache (esperado: MISS)');
    const thirdRequest = await this.makeRequest(endpoint, 'GET', undefined);
    this.results.push(thirdRequest);

    console.log('=' .repeat(50));
    console.log('');
  }

  private async testWriteOperations(): Promise<void> {
    console.log('✏️ Testando operações de escrita');
    console.log('=' .repeat(50));

    // Testar criação de música
    const testMusic = {
      title: `Teste Performance ${Date.now()}`,
      artist: 'Teste',
      lyrics: 'Letra de teste para performance',
      chords: 'C G Am F',
      isNewOfWeek: false,
    };

    console.log('📝 Criando música de teste...');
    const createResult = await this.makeRequest('/api/musics', 'POST', testMusic);
    this.results.push(createResult);

    if (createResult.cacheStatus !== 'ERROR') {
      // Testar leitura após criação (deve ser atualizado)
      console.log('📖 Lendo após criação (deve ser atualizado)...');
      const readAfterCreate = await this.makeRequest('/api/musics');
      this.results.push(readAfterCreate);

      // Testar atualização
      console.log('✏️ Atualizando música...');
      const updateResult = await this.makeRequest('/api/musics', 'PUT', {
        ...testMusic,
        id: 'test-id', // Será ignorado pelo servidor
        title: `Teste Performance Atualizado ${Date.now()}`,
      });
      this.results.push(updateResult);

      // Testar leitura após atualização
      console.log('📖 Lendo após atualização...');
      const readAfterUpdate = await this.makeRequest('/api/musics');
      this.results.push(readAfterUpdate);
    }

    console.log('=' .repeat(50));
    console.log('');
  }

  private generateReport(): void {
    console.log('📊 RELATÓRIO DE PERFORMANCE');
    console.log('=' .repeat(60));

    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.cacheStatus !== 'ERROR').length;
    const failedRequests = totalRequests - successfulRequests;

    console.log(`Total de requisições: ${totalRequests}`);
    console.log(`Sucessos: ${successfulRequests}`);
    console.log(`Falhas: ${failedRequests}`);
    console.log('');

    if (successfulRequests > 0) {
      const avgDuration = this.results
        .filter(r => r.cacheStatus !== 'ERROR')
        .reduce((sum, r) => sum + r.duration, 0) / successfulRequests;

      const cacheHits = this.results.filter(r => r.cacheStatus === 'HIT').length;
      const cacheMisses = this.results.filter(r => r.cacheStatus === 'MISS').length;
      const cacheHitRate = (cacheHits / (cacheHits + cacheMisses)) * 100;

      console.log(`Tempo médio de resposta: ${avgDuration.toFixed(2)}ms`);
      console.log(`Cache hits: ${cacheHits}`);
      console.log(`Cache misses: ${cacheMisses}`);
      console.log(`Taxa de cache hit: ${cacheHitRate.toFixed(1)}%`);
      console.log('');

      // Análise por endpoint
      const endpoints = [...new Set(this.results.map(r => r.endpoint))];
      endpoints.forEach(endpoint => {
        const endpointResults = this.results.filter(r => r.endpoint === endpoint);
        const avgEndpointDuration = endpointResults
          .filter(r => r.cacheStatus !== 'ERROR')
          .reduce((sum, r) => sum + r.duration, 0) / endpointResults.filter(r => r.cacheStatus !== 'ERROR').length;

        console.log(`${endpoint}:`);
        console.log(`  Tempo médio: ${avgEndpointDuration.toFixed(2)}ms`);
        console.log(`  Requisições: ${endpointResults.length}`);
        console.log('');
      });
    }

    // Recomendações
    console.log('💡 RECOMENDAÇÕES');
    console.log('=' .repeat(30));

    if (failedRequests > 0) {
      console.log('❌ Verificar erros nas APIs');
    }

    const avgDuration = this.results
      .filter(r => r.cacheStatus !== 'ERROR')
      .reduce((sum, r) => sum + r.duration, 0) / Math.max(successfulRequests, 1);

    if (avgDuration > 1000) {
      console.log('🐌 Tempo de resposta alto - considerar otimizações');
    } else if (avgDuration > 500) {
      console.log('⚠️ Tempo de resposta moderado - monitorar');
    } else {
      console.log('✅ Performance boa!');
    }

    const cacheHitRate = this.results.filter(r => r.cacheStatus === 'HIT').length / 
      Math.max(this.results.filter(r => ['HIT', 'MISS'].includes(r.cacheStatus)).length, 1) * 100;

    if (cacheHitRate < 50) {
      console.log('📉 Taxa de cache baixa - verificar configurações');
    } else if (cacheHitRate < 80) {
      console.log('⚠️ Taxa de cache moderada - otimizar se necessário');
    } else {
      console.log('✅ Cache funcionando bem!');
    }

    console.log('');
    console.log('=' .repeat(60));
  }

  async runTests(): Promise<void> {
    console.log('🚀 Iniciando testes de performance das APIs');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log('');

    // Testar APIs de leitura
    await this.testCacheBehavior('/api/musics');
    await this.testCacheBehavior('/api/repertoire');

    // Testar operações de escrita
    await this.testWriteOperations();

    // Gerar relatório
    this.generateReport();
  }
}

// Executar testes
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const tester = new APIPerformanceTester(baseUrl);
  
  try {
    await tester.runTests();
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 