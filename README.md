# @promstack-1/mcp-server

PromStack의 공식 MCP(Model Context Protocol) 서버 구현체입니다.  
**Official `@modelcontextprotocol/sdk`**를 사용하여 안정성과 호환성을 보장합니다.

이 서버를 통해 Claude Desktop, Cursor 등 MCP 호환 도구에서 PromStack의 프롬프트를 직접 불러오고 실행할 수 있습니다.

## 🚀 시작하기

### 1. 사전 요구사항

* Node.js 18.0.0 이상
* PromStack API Key (설정 > API Keys에서 발급)

### 2. 설치

```bash
npm install @promstack-1/mcp-server
```

### 3. CLI 실행

```bash
# 직접 실행
node bin/promstack-mcp.js --api-key YOUR_API_KEY

# 또는 환경 변수 사용
export PROMPTSTACK_API_KEY=YOUR_API_KEY
node bin/promstack-mcp.js
```

## ⚙️ Claude Desktop 설정

Claude Desktop 설정 파일 로드:

* macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
* Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "promstack": {
      "command": "node",
      "args": [
        "D:/workspace/ProjectStack/mcp-server/bin/promstack-mcp.js",
        "--api-key",
        "YOUR_PK_LIVE_KEY"
      ]
    }
  }
}
```

> **주의**: `args`의 경로는 실제 `mcp-server`가 위치한 절대 경로로 수정해야 합니다.

## 🛠️ 제공 도구 (Tools)

### 1. `list_prompts`

프로젝트의 프롬프트 목록을 조회합니다.

결과에는 각 프롬프트의 ID, 제목, 설명, 필요한 변수가 포함됩니다.
`projectId`를 지정하지 않으면 API Key에 연결된 모든 프로젝트의 프롬프트를 반환합니다.

**Parameters:**

* `projectId` (optional): 특정 프로젝트의 프롬프트만 조회
* `search` (optional): 검색어로 필터링
* `limit` (optional): 최대 결과 수 (기본: 20, 최대: 100)

**예시:**

```
list_prompts({})                           // 전체 프롬프트 목록
list_prompts({ projectId: 5 })             // 특정 프로젝트만
list_prompts({ search: "마케팅" })          // 검색
```

---

### 2. `get_prompt`

특정 프롬프트의 상세 정보를 조회합니다.

프롬프트 ID를 지정하면 해당 프롬프트의 전체 내용, 시스템 프롬프트, 필요한 변수 등을 반환합니다.
프롬프트를 실행하기 전에 상세 내용을 확인할 때 유용합니다.

**Parameters:**

* `promptId` (required): 조회할 프롬프트 ID

**예시:**

```
get_prompt({ promptId: 42 })
```

---

### 3. `select_prompt`

작업 설명을 분석하여 가장 적합한 프롬프트를 자동으로 추천합니다.

키워드 매칭을 사용하여 작업 설명과 유사한 프롬프트를 찾습니다.
추천 결과에는 각 프롬프트의 관련성 점수와 사용법이 포함됩니다.

**Selection Process:**

1. 작업 설명을 분석하여 키워드를 추출합니다
2. 제목, 설명, 카테고리 매칭 순으로 가중치를 적용합니다
3. 가장 관련성 높은 프롬프트를 반환합니다

> **중요: 첫 번째 추천 프롬프트(rank: 1)가 가장 적합한 선택입니다.**
>
> * 첫 번째 추천을 우선 사용하세요
> * 여러 좋은 후보가 있으면 첫 번째를 선택하되, 다른 옵션도 참고 가능합니다
> * 적합한 결과가 없으면 다른 키워드로 재검색하세요

**Parameters:**

* `taskDescription` (required): 수행하려는 작업에 대한 설명
* `projectId` (optional): 검색 범위를 특정 프로젝트로 제한
* `topK` (optional): 추천할 프롬프트 수 (기본: 3, 최대: 10)

**예시:**

```
select_prompt({ taskDescription: "마케팅 이메일 작성" })
select_prompt({ taskDescription: "API 인증 구현", projectId: 5 })
```

---

### 4. `export_skill`

프롬프트를 Claude Skills 형식(SKILL.md)으로 내보냅니다.

출력에는 YAML frontmatter(name, description)와 Markdown 본문이 포함됩니다.
이 형식은 Claude Desktop, Claude Code 등에서 스킬로 사용할 수 있습니다.

⚠️ **유료 기능**: Plus/Pro 플랜에서만 사용 가능합니다.

**Parameters:**

* `promptId` (required): 내보낼 프롬프트 ID
* `includeResources` (optional): 참조 리소스 포함 여부 (기본: false)

**예시:**

```
export_skill({ promptId: 42 })
export_skill({ promptId: 42, includeResources: true })
```

---

### 5. `query_context` 🆕

프롬프트에 연결된 GitHub 저장소 또는 문서 URL에서 컨텍스트를 검색합니다.

연결된 소스에서 코드, 문서, README 등을 추출하여 반환합니다.
결과는 캐싱되어 반복 요청 시 빠르게 응답합니다 (TTL: 1시간).

**특징:**

* **10,000자 제한**: Context7 호환 형식
* **자동 캐싱**: 1시간 TTL로 반복 요청 최적화
* **다중 소스**: GitHub 저장소 및 문서 URL 동시 지원

**Parameters:**

* `promptId` (required): 프롬프트 ID
* `maxTokens` (optional): 최대 토큰 수 (기본: 10000, 최대: 10000)
* `refreshCache` (optional): 캐시 무시하고 새로 가져오기 (기본: false)

**Returns:**

* 연결된 소스에서 추출한 컨텍스트 (최대 10,000자)
* 캐시 상태 정보 (cached: true/false)
* 소스별 문자 수 통계

**예시:**

```
query_context({ promptId: 42 })
query_context({ promptId: 42, maxTokens: 5000 })
query_context({ promptId: 42, refreshCache: true })
```

---

## 🏗️ 아키텍처

이 서버는 **Proxy** 역할을 수행합니다.

```
User -> MCP Client (Claude) -> MCP Server (Local) -> HTTP (JSON-RPC) -> PromStack Backend
```

* **SDK**: `@modelcontextprotocol/sdk`
* **Transport**: `StdioServerTransport`
* **Validation**: `zod`
