class ChroboAi {
  constructor() {
    this.apiKey = localStorage.getItem("gemini_api_key") || ""
    this.isApiKeyValid = localStorage.getItem("api_key_valid") === "true"
    this.settings = this.loadSettings()
    this.chats = this.loadChats()
    this.currentChat = null
    this.currentFiles = {}
    this.activeFile = null
    this.isGenerating = false
    this.selectedText = ""

    setTimeout(() => {
      this.initializeElements()
      this.bindEvents()
      this.loadSavedApiKey()
    }, 200)
  }

  loadSettings() {
    const defaultSettings = {
      model: "gemini-2.5-flash",
      temperature: 0.7,
      maxTokens: 4096,
      unlimitedTokens: false,
      topP: 0.95,
      topK: 40,
      autoSaveChats: true,
    }
    const saved = localStorage.getItem("chrobo_ai_settings")
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  }

  loadChats() {
    const saved = localStorage.getItem("chrobo_ai_chats")
    return saved ? JSON.parse(saved) : []
  }

  saveSettings() {
    localStorage.setItem("chrobo_ai_settings", JSON.stringify(this.settings))
  }

  saveChats() {
    localStorage.setItem("chrobo_ai_chats", JSON.stringify(this.chats))
  }

  initializeElements() {
    this.ideaInput = document.getElementById("ideaInput")
    this.generateBtn = document.getElementById("generateBtn")
    this.btnText = document.querySelector(".btn-text")
    this.btnLoader = document.querySelector(".btn-loader")

    this.aiResponseSection = document.getElementById("aiResponseSection")
    this.aiResponseContent = document.getElementById("aiResponseContent")
    this.codeEditorSection = document.getElementById("codeEditorSection")
    this.fileTabs = document.getElementById("fileTabs")
    this.codeContent = document.getElementById("codeContent")
    this.downloadBtn = document.getElementById("downloadBtn")

    this.continueChatSection = document.getElementById("continueChatSection")
    this.continueInput = document.getElementById("continueInput")
    this.continueBtn = document.getElementById("continueBtn")

    this.historyBtn = document.getElementById("historyBtn")
    this.apiKeyBtn = document.getElementById("apiKeyBtn")
    this.settingsBtn = document.getElementById("settingsBtn")

    this.historyModal = document.getElementById("historyModal")
    this.apiKeyModal = document.getElementById("apiKeyModal")
    this.settingsModal = document.getElementById("settingsModal")

    this.apiKeyInput = document.getElementById("apiKeyInput")
    this.saveApiKeyBtn = document.getElementById("saveApiKeyBtn")
    this.apiStatus = document.getElementById("apiStatus")

    this.modelSelect = document.getElementById("modelSelect")
    this.temperatureSlider = document.getElementById("temperatureSlider")
    this.temperatureValue = document.getElementById("temperatureValue")
    this.maxTokensInput = document.getElementById("maxTokensInput")
    this.unlimitedTokens = document.getElementById("unlimitedTokens")
    this.topPSlider = document.getElementById("topPSlider")
    this.topPValue = document.getElementById("topPValue")
    this.topKSlider = document.getElementById("topKSlider")
    this.topKValue = document.getElementById("topKValue")
    this.autoSaveChats = document.getElementById("autoSaveChats")
    this.saveSettingsBtn = document.getElementById("saveSettingsBtn")

    this.chatsList = document.getElementById("chatsList")
    this.allChatsBtn = document.getElementById("allChatsBtn")
    this.favoriteChatsBtn = document.getElementById("favoriteChatsBtn")

    this.textSelectionPopup = document.getElementById("textSelectionPopup")
    this.askAboutSelectionBtn = document.getElementById("askAboutSelectionBtn")
    this.questionModal = document.getElementById("questionModal")
    this.questionInput = document.getElementById("questionInput")
    this.askQuestionBtn = document.getElementById("askQuestionBtn")
    this.selectedTextPreview = document.getElementById("selectedTextPreview")
    this.saveNotification = document.getElementById("saveNotification")
  }

  bindEvents() {
    if (this.generateBtn) {
      this.generateBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.generateExtension()
      })
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.downloadExtension()
      })
    }

    if (this.continueBtn) {
      this.continueBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.continueChat()
      })
    }

    if (this.historyBtn) {
      this.historyBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.openModal("historyModal")
      })
    }

    if (this.apiKeyBtn) {
      this.apiKeyBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.openModal("apiKeyModal")
      })
    }

    if (this.settingsBtn) {
      this.settingsBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.openModal("settingsModal")
      })
    }

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault()
        this.saveCodeChanges()
      }
    })

    document.addEventListener("mouseup", (e) => {
      this.handleTextSelection(e)
    })

    if (this.askAboutSelectionBtn) {
      this.askAboutSelectionBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.openQuestionModal()
      })
    }

    if (this.askQuestionBtn) {
      this.askQuestionBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.askQuestionAboutSelection()
      })
    }

    const editInstructionBtn = document.getElementById("editInstructionBtn")
    if (editInstructionBtn) {
      editInstructionBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.editLastInstruction()
      })
    }

    const stopGenerationBtn = document.getElementById("stopGenerationBtn")
    if (stopGenerationBtn) {
      stopGenerationBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.stopGeneration()
      })
    }

    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        const modalId = btn.getAttribute("data-modal")
        if (modalId) {
          this.closeModal(modalId)
        }
      })
    })

    if (this.saveApiKeyBtn) {
      this.saveApiKeyBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.validateAndSaveApiKey()
      })
    }

    if (this.apiKeyInput) {
      this.apiKeyInput.addEventListener("input", () => this.onApiKeyChange())
    }

    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.saveUserSettings()
      })
    }

    if (this.resetSettingsBtn) {
      this.resetSettingsBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.resetSettings()
      })
    }

    if (this.temperatureSlider) {
      this.temperatureSlider.addEventListener("input", (e) => {
        if (this.temperatureValue) {
          this.temperatureValue.textContent = e.target.value
        }
      })
    }

    if (this.topPSlider) {
      this.topPSlider.addEventListener("input", (e) => {
        if (this.topPValue) {
          this.topPValue.textContent = e.target.value
        }
      })
    }

    if (this.topKSlider) {
      this.topKSlider.addEventListener("input", (e) => {
        if (this.topKValue) {
          this.topKValue.textContent = e.target.value
        }
      })
    }

    if (this.unlimitedTokens) {
      this.unlimitedTokens.addEventListener("change", (e) => {
        if (this.maxTokensInput) {
          this.maxTokensInput.disabled = e.target.checked
          if (e.target.checked) {
            this.maxTokensInput.value = ""
            this.maxTokensInput.placeholder = "ללא הגבלה"
          } else {
            this.maxTokensInput.value = 4096
            this.maxTokensInput.placeholder = ""
          }
        }
      })
    }

    if (this.allChatsBtn) {
      this.allChatsBtn.addEventListener("click", () => this.showAllChats())
    }

    if (this.favoriteChatsBtn) {
      this.favoriteChatsBtn.addEventListener("click", () => this.showFavoriteChats())
    }

    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.preventDefault()
        this.closeModal(e.target.id)
      }
    })

    if (this.codeContent) {
      this.codeContent.addEventListener("mouseup", () => {
        this.handleTextSelection()
      })
      // Removed the 'input' listener for saveCodeChanges to fix issue 4
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.style.display = "block"

      if (modalId === "apiKeyModal") {
        this.loadApiKeyModal()
      } else if (modalId === "settingsModal") {
        this.loadSettingsModal()
      } else if (modalId === "historyModal") {
        this.loadHistoryModal()
      } else if (modalId === "questionModal") {
        this.loadQuestionModal()
      }
    } else {
      console.error("[v0] Modal not found:", modalId)
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    modal.style.display = "none"
  }

  loadApiKeyModal() {
    this.apiKeyInput.value = this.apiKey
    if (this.isApiKeyValid) {
      this.showApiStatus("מפתח תקין ✓", "success")
    } else {
      this.apiStatus.textContent = ""
      this.apiStatus.className = "api-status"
    }
  }

  loadSettingsModal() {
    this.modelSelect.value = this.settings.model
    this.temperatureSlider.value = this.settings.temperature
    this.temperatureValue.textContent = this.settings.temperature
    this.maxTokensInput.value = this.settings.maxTokens
    this.unlimitedTokens.checked = this.settings.unlimitedTokens
    this.topPSlider.value = this.settings.topP
    this.topPValue.textContent = this.settings.topP
    this.topKSlider.value = this.settings.topK
    this.topKValue.textContent = this.settings.topK
    this.autoSaveChats.checked = this.settings.autoSaveChats

    this.maxTokensInput.disabled = this.settings.unlimitedTokens
    if (this.settings.unlimitedTokens) {
      this.maxTokensInput.placeholder = "ללא הגבלה"
    }
  }

  loadHistoryModal() {
    this.renderChatsList()
  }

  loadQuestionModal() {
    this.questionInput.value = ""
  }

  loadSavedApiKey() {}

  onApiKeyChange() {
    this.isApiKeyValid = false
    localStorage.removeItem("api_key_valid")
    this.apiStatus.textContent = ""
    this.apiStatus.className = "api-status"
  }

  async validateAndSaveApiKey() {
    const apiKey = this.apiKeyInput.value.trim()

    if (!apiKey) {
      this.showApiStatus("אנא הכנס מפתח API", "error")
      return
    }

    this.saveApiKeyBtn.disabled = true
    this.saveApiKeyBtn.textContent = "בודק..."

    try {
      const testModel = "gemini-1.5-flash"
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "test" }] }] }),
        },
      )

      if (response.ok) {
        localStorage.setItem("gemini_api_key", apiKey)
        localStorage.setItem("api_key_valid", "true")
        this.apiKey = apiKey
        this.isApiKeyValid = true
        this.showApiStatus("מפתח תקין ✓", "success")
      } else {
        throw new Error("מפתח לא תקין")
      }
    } catch (error) {
      this.showApiStatus("שגיאה: " + error.message, "error")
    } finally {
      this.saveApiKeyBtn.disabled = false
      this.saveApiKeyBtn.textContent = "שמור מפתח"
    }
  }

  showApiStatus(message, type) {
    this.apiStatus.textContent = message
    this.apiStatus.classList.add(type)
  }

  saveUserSettings() {
    this.settings.model = this.modelSelect.value
    this.settings.temperature = parseFloat(this.temperatureSlider.value)
    this.settings.unlimitedTokens = this.unlimitedTokens.checked
    this.settings.maxTokens = this.settings.unlimitedTokens ? null : parseInt(this.maxTokensInput.value)
    this.settings.topP = parseFloat(this.topPSlider.value)
    this.settings.topK = parseInt(this.topKSlider.value)
    this.settings.autoSaveChats = this.autoSaveChats.checked
    this.saveSettings()
    alert("ההגדרות נשמרו בהצלחה!")
    this.closeModal("settingsModal")
  }

  resetSettings() {
    if (confirm("האם אתה בטוח שברצונך לאפס את ההגדרות?")) {
      localStorage.removeItem("chrobo_ai_settings")
      this.settings = this.loadSettings()
      this.loadSettingsModal()
      alert("ההגדרות אופסו בהצלחה!")
    }
  }

  async generateExtension() {
    const idea = this.ideaInput.value.trim()

    if (!idea) {
      alert("אנא תאר את הרעיון שלך")
      return
    }

    if (!this.isApiKeyValid) {
      alert("אנא הכנס מפתח API תקין")
      this.openModal("apiKeyModal")
      return
    }

    this.setGenerateButtonLoading(true)
    this.isGenerating = true

    try {
      const response = await this.callGeminiAPI(idea, true)
      this.displayAIResponse(response)
      const files = this.parseCodeToFiles(response)
      this.currentFiles = files
      this.renderFileTabs()

      const firstFile = Object.keys(files)[0]
      if (firstFile) {
        this.showFile(firstFile)
      }

      this.aiResponseSection.style.display = "block"
      this.codeEditorSection.style.display = "block"
      this.continueChatSection.style.display = "block"
      this.aiResponseSection.scrollIntoView({ behavior: "smooth" })

      if (this.settings.autoSaveChats) {
        this.saveCurrentChat(idea, response)
      }
    } catch (error) {
      alert("שגיאה ביצירת התוסף: " + error.message)
    } finally {
      this.setGenerateButtonLoading(false)
      this.isGenerating = false
    }
  }

  async continueChat() {
    const additionalInput = this.continueInput.value.trim()

    if (!additionalInput) {
      alert("אנא כתוב הודעה להמשך השיחה")
      return
    }

    if (!this.isApiKeyValid) {
      alert("אנא הכנס מפתח API תקין")
      this.openModal("apiKeyModal")
      return
    }

    this.setContinueButtonLoading(true)

    try {
      const lastResponse = this.aiResponseContent.textContent
      const prompt = `הרעיון המקורי: ${this.ideaInput.value}\nתשובה קודמת: ${lastResponse}\nהוראות נוספות: ${additionalInput}`
      const response = await this.callGeminiAPI(prompt, false, additionalInput)
      this.displayAIResponse(response)
      const files = this.parseCodeToFiles(response)
      this.currentFiles = { ...this.currentFiles, ...files }
      this.renderFileTabs()

      const firstFile = Object.keys(files)[0] || this.activeFile
      if (firstFile) {
        this.showFile(firstFile)
      }

      this.aiResponseSection.scrollIntoView({ behavior: "smooth" })

      if (this.settings.autoSaveChats && this.currentChat) {
        this.currentChat.response += "\n\n" + response
        this.saveChats()
      }
    } catch (error) {
      alert("שגיאה בהמשך השיחה: " + error.message)
    } finally {
      this.setContinueButtonLoading(false)
      this.continueInput.value = ""
    }
  }

  async callGeminiAPI(prompt, isInitial = true, additionalInput = "") {
    const systemPrompt = `אתה מחולל תוספי Chrome מותאמים אישית. תפקידך: לנתח את הרעיון של המשתמש, לייצר קבצים נפרדים בדיוק בפורמט הבא: === filename.ext ===\n\`\`\`language\ncode here\n\`\`\`
    - חובה: הפרד כל קובץ בנפרד, אל תשלב תשובה טקסטואלית עם קוד. התחל מיד בקבצים.
    - יכולות: יצור קבצים כמו manifest.json, background.js, popup.html וכו'. השתמש ב-API של Chrome extensions.
    - אסור: אל תגיד למשתמש להעתיק/הדביק קוד ידנית - תמיד הנח להוריד ZIP. אל תציע פעולות חיצוניות כמו התקנה או עריכה מחוץ לאתר. התמקד ביצירת תוסף בטוח ותקין.
    - אם יש עדכונים: עדכן רק קבצים רלוונטיים, שמור על מבנה נפרד.
    - תשובה: התחל בהסבר קצר (ללא קוד), ואז הקבצים הנפרדים. סיים בהנחיה להוריד ZIP.`;

    const fullPrompt = isInitial ? `${systemPrompt}\n\nרעיון: ${prompt}` : `${systemPrompt}\n\n${prompt}`

    const maxTokens = this.settings.unlimitedTokens ? null : this.settings.maxTokens

    const requestBody = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: this.settings.temperature,
        topP: this.settings.topP,
        topK: this.settings.topK,
        maxOutputTokens: maxTokens,
      },
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    )

    if (!response.ok) {
      throw new Error("תגובה לא תקינה מה-API")
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  displayAIResponse(response) {
    this.aiResponseContent.textContent = response
  }

  parseCodeToFiles(code) {
    const files = {}
    const filePattern = /===\s*([^=]+)\s*===\s*([\s\S]*?)(?====|$)/g
    let match

    while ((match = filePattern.exec(code)) !== null) {
      const fileName = match[1].trim()
      let fileContent = match[2].trim()

      fileContent = fileContent
        .replace(/^```[\w]*\n?/gm, "")
        .replace(/\n?```$/gm, "")
        .replace(/^---.*$/gm, "")
        .trim()

      if (fileName && fileContent) {
        files[fileName] = fileContent
      }
    }

    // Improved fallback: if no === found, try to split by common file names or code blocks
    if (Object.keys(files).length === 0) {
      const fallbackPattern = /(manifest\.json|popup\.html|popup\.js|styles\.css|background\.js|content\.js)[\s\S]*?```[\w]*\n?([\s\S]*?)```/g

      while ((match = fallbackPattern.exec(code)) !== null) {
        const fileName = match[1]
        let fileContent = match[2].trim()

        fileContent = fileContent
          .replace(/^```[\w]*\n?/gm, "")
          .replace(/\n?```$/gm, "")
          .trim()

        if (fileName && fileContent) {
          files[fileName] = fileContent
        }
      }

      // If still empty, assume single file and warn
      if (Object.keys(files).length === 0 && code.includes("```")) {
        files["extension.js"] = code.replace(/```[\w]*\n?/g, "").trim() // Fallback to single file
        console.warn("Fallback to single file due to parsing issue")
      }
    }

    return files
  }

  renderFileTabs() {
    this.fileTabs.innerHTML = ""

    Object.keys(this.currentFiles).forEach((filename) => {
      const tab = document.createElement("button")
      tab.className = "file-tab"
      tab.textContent = filename
      tab.addEventListener("click", () => this.showFile(filename))
      this.fileTabs.appendChild(tab)
    })
  }

  showFile(filename) {
    document.querySelectorAll(".file-tab").forEach((tab) => {
      tab.classList.remove("active")
      if (tab.textContent === filename) {
        tab.classList.add("active")
      }
    })

    this.activeFile = filename
    this.renderCodeWithHighlighting(this.currentFiles[filename] || "", filename)
  }

  renderCodeWithHighlighting(code, filename) {
    const lines = code.split("\n")
    const language = this.getLanguageFromFilename(filename)

    const highlightedCode = lines
      .map((line, index) => {
        const lineNumber = index + 1
        const highlightedLine = this.highlightSyntax(line, language)
        return `<div class="code-line">
        <span class="line-number">${lineNumber}</span>
        <span class="line-content">${highlightedLine}</span>
      </div>`
      })
      .join("")

    this.codeContent.innerHTML = highlightedCode
    this.codeContent.contentEditable = true
    this.codeContent.style.direction = "ltr"
    this.codeContent.style.textAlign = "left"
  }

  getLanguageFromFilename(filename) {
    const ext = filename.split(".").pop().toLowerCase()
    const langMap = {
      js: "javascript",
      json: "json",
      html: "html",
      css: "css",
      txt: "text",
    }
    return langMap[ext] || "text"
  }

  highlightSyntax(line, language) {
    if (language === "javascript") {
      return line
        .replace(
          /\b(const|let|var|function|if|else|for|while|return|true|false|null|undefined)\b/g,
          '<span class="keyword">$1</span>',
        )
        .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
        .replace(/'([^']*)'/g, "<span class=\"string\">'$1'</span>")
        .replace(/\/\/(.*)$/g, '<span class="comment">//$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
    } else if (language === "json") {
      return line
        .replace(/"([^"]*)":/g, '<span class="property">"$1"</span>:')
        .replace(/:\s*"([^"]*)"/g, ': <span class="string">"$1"</span>')
        .replace(/:\s*(\d+)/g, ': <span class="number">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span class="keyword">$1</span>')
    } else if (language === "html") {
      return line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/&lt;(\/?[a-zA-Z][^&gt;]*)&gt;/g, '<span class="tag">&lt;$1&gt;</span>')
        .replace(/(\w+)=/g, '<span class="attribute">$1</span>=')
        .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
    } else if (language === "css") {
      return line
        .replace(/([a-zA-Z-]+)\s*:/g, '<span class="property">$1</span>:')
        .replace(/:\s*([^;]+);/g, ': <span class="value">$1</span>;')
        .replace(/\/\*(.|\n)*?\*\//g, '<span class="comment">$&</span>')
        .replace(/\{|\}/g, '<span class="bracket">$&</span>')
    }
    return line
  }

  saveCodeChanges() {
    if (this.activeFile && this.currentFiles[this.activeFile]) {
      const currentContent = this.codeContent.textContent || this.codeContent.innerText
      this.currentFiles[this.activeFile] = currentContent

      this.showSaveNotification()

      this.updateZipData()
    }
  }

  showSaveNotification() {
    if (this.saveNotification) {
      this.saveNotification.style.display = "block"
      setTimeout(() => {
        this.saveNotification.style.display = "none"
      }, 3000)
    }
  }

  handleTextSelection(e) {
    const selection = window.getSelection()
    const selectedText = selection.toString().trim()

    if (selectedText.length > 0) {
      const selectionContainer = selection.anchorNode.parentElement
      if (
        selectionContainer.closest("#aiResponseContent") ||
        selectionContainer.closest("#codeContent")
      ) {
        this.selectedText = selectedText
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        this.textSelectionPopup.style.display = "block"
        this.textSelectionPopup.style.left = rect.left + "px"
        this.textSelectionPopup.style.top = rect.bottom + window.scrollY + 5 + "px"
      }
    } else {
      this.textSelectionPopup.style.display = "none"
    }
  }

  openQuestionModal() {
    this.selectedTextPreview.textContent = this.selectedText
    this.textSelectionPopup.style.display = "none"
    this.openModal("questionModal")
  }

  async askQuestionAboutSelection() {
    const question = this.questionInput.value.trim()
    if (!question) {
      alert("אנא כתוב שאלה")
      return
    }

    try {
      const response = await this.callGeminiAPI(
        `השאלה שלי על הקוד/טקסט הבא: "${this.selectedText}"\n\nהשאלה: ${question}`,
        false,
        "",
      )

      this.displayAIResponse(response)
      this.aiResponseSection.style.display = "block"
      this.aiResponseSection.scrollIntoView({ behavior: "smooth" })

      this.closeModal("questionModal")
      this.questionInput.value = ""
    } catch (error) {
      alert("שגיאה בשליחת השאלה: " + error.message)
    }
  }

  saveCurrentChat(idea, response) {
    const chatTitle = this.generateChatTitle(idea)
    const chat = {
      id: Date.now(),
      title: chatTitle,
      idea: idea,
      response: response,
      files: this.currentFiles,
      date: new Date().toISOString(),
      favorite: false,
    }

    this.chats.unshift(chat)
    this.saveChats()
  }

  generateChatTitle(idea) {
    const words = idea.split(" ").slice(0, 4)
    return words.join(" ") + (idea.split(" ").length > 4 ? "..." : "")
  }

  renderChatsList(showFavorites = false) {
    const chatsToShow = showFavorites ? this.chats.filter((chat) => chat.favorite) : this.chats

    if (chatsToShow.length === 0) {
      this.chatsList.innerHTML = '<div class="empty-state">אין צ\'אטים שמורים עדיין</div>'
      return
    }

    this.chatsList.innerHTML = chatsToShow
      .map(
        (chat) => `
      <div class="chat-item ${chat.favorite ? "favorite" : ""}" data-chat-id="${chat.id}">
        <div class="chat-actions">
          <button class="chat-action-btn" onclick="chromegenie.toggleFavorite(${chat.id})">
            ${chat.favorite ? "⭐" : "☆"}
          </button>
          <button class="chat-action-btn" onclick="chromegenie.deleteChat(${chat.id})">
            🗑️
          </button>
        </div>
        <div class="chat-title">${chat.title}</div>
        <div class="chat-preview">${chat.idea.substring(0, 100)}...</div>
        <div class="chat-date">${new Date(chat.date).toLocaleDateString("he-IL")}</div>
      </div>
    `,
      )
      .join("")

    document.querySelectorAll(".chat-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.classList.contains("chat-action-btn")) {
          const chatId = Number.parseInt(item.dataset.chatId)
          this.loadChat(chatId)
        }
      })
    })
  }

  showAllChats() {
    this.allChatsBtn.classList.add("active")
    this.favoriteChatsBtn.classList.remove("active")
    this.renderChatsList(false)
  }

  showFavoriteChats() {
    this.favoriteChatsBtn.classList.add("active")
    this.allChatsBtn.classList.remove("active")
    this.renderChatsList(true)
  }

  toggleFavorite(chatId) {
    const chat = this.chats.find((c) => c.id === chatId)
    if (chat) {
      chat.favorite = !chat.favorite
      this.saveChats()
      this.renderChatsList(this.favoriteChatsBtn.classList.contains("active"))
    }
  }

  deleteChat(chatId) {
    if (confirm("האם אתה בטוח שברצונך למחוק את הצ'אט הזה?")) {
      this.chats = this.chats.filter((c) => c.id !== chatId)
      this.saveChats()
      this.renderChatsList(this.favoriteChatsBtn.classList.contains("active"))
    }
  }

  loadChat(chatId) {
    const chat = this.chats.find((c) => c.id === chatId)
    if (chat) {
      this.ideaInput.value = chat.idea
      this.currentFiles = chat.files
      this.displayAIResponse(chat.response)
      this.renderFileTabs()

      const firstFile = Object.keys(this.currentFiles)[0]
      if (firstFile) {
        this.showFile(firstFile)
      }

      this.aiResponseSection.style.display = "block"
      this.codeEditorSection.style.display = "block"
      this.closeModal("historyModal")
      this.aiResponseSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  downloadExtension() {
    try {
      this.createAndDownloadZip(this.currentFiles)
    } catch (error) {
      console.error("[v0] Download failed:", error)
      alert("שגיאה בהורדה. אנא העתק את הקוד ושמור ידנית.")
    }
  }

  createAndDownloadZip(files) {
    const JSZip = window.JSZip
    const zip = new JSZip()

    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content)
    })

    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = "chrome-extension.zip"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  stopGeneration() {
    this.isGenerating = false
    this.setGenerateButtonLoading(false)
    alert("יצירת התוסף הופסקה")
  }

  setGenerateButtonLoading(loading) {
    this.generateBtn.disabled = loading
    const stopBtn = document.getElementById("stopGenerationBtn")
    if (loading) {
      this.btnText.style.display = "none"
      this.btnLoader.style.display = "inline"
      if (stopBtn) stopBtn.style.display = "inline-block"
    } else {
      this.btnText.style.display = "inline"
      this.btnLoader.style.display = "none"
      if (stopBtn) stopBtn.style.display = "none"
    }
  }

  setContinueButtonLoading(loading) {
    this.continueBtn.disabled = loading
    if (loading) {
      this.continueBtn.innerHTML = '<div class="spinner"></div> מעדכן...'
    } else {
      this.continueBtn.innerHTML = "שלח"
    }
  }

  updateZipData() {
    // Placeholder for future implementation
  }

  editLastInstruction() {
    // Placeholder for future implementation
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.chromegenie = new ChroboAi()
})
