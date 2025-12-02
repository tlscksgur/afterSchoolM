# 방과후 학교 관리 시스템 (After School Management System)

이 프로젝트는 방과후 학교 관리 시스템의 프론트엔드입니다.

## 🚀 배포 방법 (Vercel)

이 프로젝트는 정적 웹사이트이므로 Vercel을 통해 무료로 쉽게 배포할 수 있습니다.

### 방법 1: Vercel CLI 사용 (추천)

터미널에서 바로 배포할 수 있습니다.

1.  **Vercel CLI 실행** (설치 없이 실행 가능):
    ```bash
    npx vercel
    ```
2.  **질문에 답변**:
    - `Set up and deploy “~/.../afterSchoolM-main”?` -> `y` (Yes)
    - `Which scope do you want to deploy to?` -> 엔터 (기본값)
    - `Link to existing project?` -> `n` (No)
    - `What’s your project’s name?` -> 엔터 (기본값 사용) 또는 원하는 이름 입력
    - `In which directory is your code located?` -> 엔터 (현재 폴더 `./`)
    - `Want to modify these settings?` -> `n` (No)

3.  배포가 완료되면 `Production: https://...` 주소가 나옵니다. 해당 주소로 접속하면 됩니다.

### 방법 2: GitHub 연동

1.  이 프로젝트를 GitHub 저장소(Repository)에 올립니다.
2.  [Vercel 대시보드](https://vercel.com/new)에 접속합니다.
3.  GitHub 계정으로 로그인하고, 방금 올린 저장소를 `Import` 합니다.
4.  별도 설정 없이 `Deploy` 버튼을 누르면 배포됩니다.

## 🛠️ 개발 환경 실행

로컬에서 실행하려면 다음 명령어를 사용하세요 (Python 3 필요):

```bash
python3 -m http.server 5500
```

브라우저에서 `http://localhost:5500`으로 접속하세요.
