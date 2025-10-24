import React, { useState, useEffect } from "react";
import "./App.css";

// تابع برای تولید ID یکتا
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const globalStorage = {
  setItem: async (key, value) => {
    await fetch("https://api.jsonbin.io/v3/b/68fb0f30ae596e708f2813d5", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key":
          "$2a$10$toN3vhOXs2adB5aFAVie8uknzBB5fpifGIDgbskiSgZWDpvSy15cu",
      },
      body: JSON.stringify({ [key]: value }),
    });
  },

  getItem: async (key) => {
    const response = await fetch(
      "https://api.jsonbin.io/v3/b/68fb0f30ae596e708f2813d5/latest",
      {
        headers: {
          "X-Master-Key":
            "$2a$10$toN3vhOXs2adB5aFAVie8uknzBB5fpifGIDgbskiSgZWDpvSy15cu",
        },
      }
    );
    const data = await response.json();
    return data.record[key];
  },
};

function App() {
  const [words, setWords] = useState([]);
  const [activeTab, setActiveTab] = useState("unlearned");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [inputText, setInputText] = useState("");
  const [newWord, setNewWord] = useState({ english: "", persian: "" });
  const [editingWord, setEditingWord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [translationInput, setTranslationInput] = useState("");
  const [translationResult, setTranslationResult] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationDirection, setTranslationDirection] = useState("faToEn");

  // بارگذاری کلمات از localStorage هنگام لود اولیه
  useEffect(() => {
    const getData = async () => {
      const globalData = await globalStorage.getItem("vocabularyWords");
      console.log({ globalData });
      if (globalData?.length) {
        setWords(globalData);
      } else {
        const savedWords = localStorage.getItem("vocabularyWords");
        if (savedWords) {
          setWords(JSON.parse(savedWords));
        }
      }
      setIsLoaded(true);
    };

    getData();
  }, []);

  // ذخیره کلمات در localStorage هر زمان که تغییر کنند
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("vocabularyWords", JSON.stringify(words));
    globalStorage.setItem("vocabularyWords", words);
  }, [words]);

  // پخش تلفظ کلمه انگلیسی
  // در تابع speakWord، پارامتر language را به صورت زیر تنظیم کنید:
  const speakWord = (text, language = "en-US") => {
    if ("speechSynthesis" in window) {
      // توقف پخش قبلی
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.8;
      utterance.pitch = 1;

      setIsPlaying(true);

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      speechSynthesis.speak(utterance);
    } else {
      alert("مرورگر شما از قابلیت Text-to-Speech پشتیبانی نمی‌کند");
    }
  };

  // توقف پخش صدا
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // تابع translateText قبلی را با این نسخه جایگزین کنید:
  const translateText = async (text, fromLang, toLang) => {
    if (!text.trim()) return;

    setIsTranslating(true);
    setTranslationResult("");

    try {
      // استفاده از API رایگان MyMemory برای ترجمه
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${fromLang}|${toLang}`
      );

      const data = await response.json();

      if (data.responseStatus === 200) {
        setTranslationResult(data.responseData.translatedText);
      } else {
        setTranslationResult("خطا در ترجمه. لطفا دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("Translation error:", error);
      setTranslationResult("خطا در اتصال به سرویس ترجمه");
    } finally {
      setIsTranslating(false);
    }
  };

  // پردازش متن ورودی و تبدیل به کلمات
  const processInputText = () => {
    if (!inputText.trim()) return;

    const lines = inputText.split("\n");
    const newWords = [];

    lines.forEach((line) => {
      const parts = line.split(":");
      if (parts.length >= 2) {
        const english = parts[0].trim();
        const persian = parts[1].trim();

        if (english && persian) {
          newWords.push({
            id: generateId(),
            english,
            persian,
            done: false,
          });
        }
      }
    });

    if (newWords.length > 0) {
      setWords((prevWords) => [...prevWords, ...newWords]);
      setInputText("");
      alert(`${newWords.length} کلمه جدید اضافه شد`);
    }
  };

  // اضافه کردن کلمه جدید
  const addNewWord = () => {
    if (!newWord.english.trim() || !newWord.persian.trim()) {
      alert("لطفا هر دو فیلد انگلیسی و فارسی را پر کنید");
      return;
    }

    const word = {
      id: generateId(),
      english: newWord.english.trim(),
      persian: newWord.persian.trim(),
      done: false,
    };

    setWords((prevWords) => [...prevWords, word]);
    setNewWord({ english: "", persian: "" });
  };

  // ویرایش کلمه
  const updateWord = () => {
    if (!editingWord.english.trim() || !editingWord.persian.trim()) {
      alert("لطفا هر دو فیلد انگلیسی و فارسی را پر کنید");
      return;
    }

    setWords((prevWords) =>
      prevWords.map((word) => (word.id === editingWord.id ? editingWord : word))
    );
    setEditingWord(null);
  };

  // حذف کلمه
  const deleteWord = (id) => {
    if (window.confirm("آیا از حذف این کلمه مطمئنید؟")) {
      setWords((prevWords) => prevWords.filter((word) => word.id !== id));
    }
  };

  // علامت‌گذاری کلمه به عنوان یادگرفته شده
  const markAsKnown = () => {
    if (filteredWords.length === 0) return;

    const currentWord = filteredWords[currentCardIndex];
    setWords((prevWords) =>
      prevWords.map((word) =>
        word.id === currentWord.id ? { ...word, done: true } : word
      )
    );

    nextCard();
  };

  // علامت‌گذاری کلمه به عنوان یادگرفته نشده
  const markAsUnknown = () => {
    if (filteredWords.length === 0) return;

    const currentWord = filteredWords[currentCardIndex];
    setWords((prevWords) =>
      prevWords.map((word) =>
        word.id === currentWord.id ? { ...word, done: false } : word
      )
    );

    nextCard();
  };

  // رفتن به کارت بعدی
  const nextCard = () => {
    setShowTranslation(false);
    if (filteredWords.length <= 1) return;

    setCurrentCardIndex((prevIndex) =>
      prevIndex >= filteredWords.length - 1 ? 0 : prevIndex + 1
    );
  };

  // رفتن به کارت قبلی
  const prevCard = () => {
    setShowTranslation(false);
    if (filteredWords.length <= 1) return;

    setCurrentCardIndex((prevIndex) =>
      prevIndex <= 0 ? filteredWords.length - 1 : prevIndex - 1
    );
  };

  // فیلتر کردن کلمات بر اساس تب فعال
  const filteredWords = words.filter((word) => {
    const matchesTab = activeTab === "learned" ? word.done : !word.done;
    const matchesSearch =
      word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.persian.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  // ریست کردن تمام کلمات
  const resetAllWords = () => {
    if (window.confirm("آیا از بازنشانی وضعیت تمام کلمات مطمئنید؟")) {
      setWords((prevWords) =>
        prevWords.map((word) => ({ ...word, done: false }))
      );
    }
  };

  // حذف تمام کلمات
  const deleteAllWords = () => {
    if (
      window.confirm("آیا از حذف تمام کلمات مطمئنید؟ این عمل قابل بازگشت نیست.")
    ) {
      setWords([]);
    }
  };

  // کلمات جاری برای نمایش در فلش کارت
  const currentWord =
    filteredWords.length > 0 ? filteredWords[currentCardIndex] : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>📚 اپلیکیشن یادگیری لغات انگلیسی</h1>
      </header>

      <div className="container">
        {/* تب‌ها */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "unlearned" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("unlearned");
              setCurrentCardIndex(0);
              setShowTranslation(false);
            }}
          >
            کلمات جدید ({words.filter((w) => !w.done).length})
          </button>
          <button
            className={`tab ${activeTab === "learned" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("learned");
              setCurrentCardIndex(0);
              setShowTranslation(false);
            }}
          >
            کلمات یادگرفته شده ({words.filter((w) => w.done).length})
          </button>
        </div>

        {/* بخش فلش کارت */}
        <div className="flashcard-section">
          {currentWord ? (
            <div className="flashcard-container">
              <div className="card-counter">
                {currentCardIndex + 1} / {filteredWords.length}
              </div>

              <div
                className={`flashcard ${showTranslation ? "flipped" : ""}`}
                onClick={() => setShowTranslation(!showTranslation)}
              >
                <div className="card-front">
                  <h2>{currentWord.english}</h2>
                  <div className="audio-controls">
                    <button
                      className={`btn-audio ${isPlaying ? "playing" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPlaying) {
                          stopSpeaking();
                        } else {
                          speakWord(currentWord.english);
                        }
                      }}
                    >
                      {isPlaying ? "⏹️ توقف" : "🔊 پخش تلفظ"}
                    </button>
                  </div>
                  <p>برای دیدن معنی کلیک کنید</p>
                </div>
                <div className="card-back">
                  <h2>{currentWord.persian}</h2>
                  <p>{currentWord.english}</p>
                  <div className="audio-controls">
                    <button
                      className="btn-audio"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(currentWord.english);
                      }}
                    >
                      🔊 پخش تلفظ
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn unknown" onClick={markAsUnknown}>
                  بلد نبودم
                </button>
                <button className="btn known" onClick={markAsKnown}>
                  بلد بودم
                </button>
              </div>

              <div className="card-navigation">
                <button onClick={prevCard}>قبلی</button>
                <button onClick={nextCard}>بعدی</button>
              </div>
            </div>
          ) : (
            <div className="no-words">
              {searchTerm
                ? "کلمه‌ای با این مشخصات یافت نشد"
                : "کلمه‌ای برای نمایش وجود ندارد"}
            </div>
          )}
        </div>

        {/* بخش مترجم */}
        <div className="translator-section">
          <h2>
            مترجم
            <button
              className="direction-toggle"
              onClick={() =>
                setTranslationDirection(
                  translationDirection === "faToEn" ? "enToFa" : "faToEn"
                )
              }
            >
              {translationDirection === "faToEn"
                ? "فارسی به انگلیسی 🔄"
                : "انگلیسی به فارسی 🔄"}
            </button>
          </h2>
          <div className="translator-container">
            <div className="translator-input">
              <textarea
                value={translationInput}
                onChange={(e) => setTranslationInput(e.target.value)}
                placeholder={
                  translationDirection === "faToEn"
                    ? "متن فارسی خود را اینجا وارد کنید..."
                    : "Enter English text here..."
                }
                rows="3"
              />
              <div className="translator-actions">
                <button
                  onClick={() => {
                    if (translationDirection === "faToEn") {
                      translateText(translationInput, "fa", "en");
                    } else {
                      translateText(translationInput, "en", "fa");
                    }
                  }}
                  disabled={isTranslating || !translationInput.trim()}
                >
                  {isTranslating
                    ? "در حال ترجمه..."
                    : translationDirection === "faToEn"
                    ? "ترجمه به انگلیسی"
                    : "ترجمه به فارسی"}
                </button>
                <button
                  onClick={() => {
                    const lang =
                      translationDirection === "faToEn" ? "fa" : "en-US";
                    speakWord(translationResult || translationInput, lang);
                  }}
                  disabled={!translationResult && !translationInput}
                >
                  🔊 پخش
                </button>
              </div>
            </div>
            <div className="translation-result">
              <h4>نتیجه ترجمه:</h4>
              <div className="result-text">
                {translationResult ||
                  (translationDirection === "faToEn"
                    ? "ترجمه انگلیسی اینجا نمایش داده می‌شود..."
                    : "ترجمه فارسی اینجا نمایش داده می‌شود...")}
              </div>
            </div>
          </div>
        </div>

        {/* بخش مدیریت کلمات */}
        <div className="management-section">
          <h2>مدیریت کلمات</h2>

          {/* جستجو */}
          <div className="search-box">
            <input
              type="text"
              placeholder="جستجو در کلمات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* افزودن کلمات با فرمت متنی */}
          <div className="input-section">
            <h3>افزودن کلمات با فرمت متنی</h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="هر خط یک کلمه با فرمت: english:persian
مثال:
center:وسط
venteral:شکمی"
              rows="5"
            />
            <button onClick={processInputText}>افزودن کلمات</button>
          </div>

          {/* افزودن کلمه تکی */}
          <div className="add-word-section">
            <h3>افزودن کلمه جدید</h3>
            <div className="word-inputs">
              <input
                type="text"
                placeholder="کلمه انگلیسی"
                value={newWord.english}
                onChange={(e) =>
                  setNewWord({ ...newWord, english: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="معنی فارسی"
                value={newWord.persian}
                onChange={(e) =>
                  setNewWord({ ...newWord, persian: e.target.value })
                }
              />
              <button onClick={addNewWord}>افزودن</button>
            </div>
          </div>

          {/* لیست کلمات */}
          <div className="words-list">
            <h3>لیست کلمات ({words.length})</h3>

            <div className="list-actions">
              <button className="btn-reset" onClick={resetAllWords}>
                بازنشانی وضعیت همه کلمات
              </button>
              <button className="btn-delete-all" onClick={deleteAllWords}>
                حذف همه کلمات
              </button>
            </div>

            <div className="words-grid">
              {words.map((word) => (
                <div
                  key={word.id}
                  className={`word-item ${word.done ? "learned" : ""}`}
                >
                  <div className="word-content">
                    <div className="word-english">{word.english}</div>
                    <div className="word-persian">{word.persian}</div>
                    <div className="word-status">
                      {word.done ? "✓ یادگرفته شده" : "در حال یادگیری"}
                    </div>
                  </div>
                  <div className="word-actions">
                    <button
                      className="btn-audio-small"
                      onClick={() => speakWord(word.english)}
                      title="پخش تلفظ"
                    >
                      🔊
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => setEditingWord({ ...word })}
                    >
                      ویرایش
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => deleteWord(word.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* مودال ویرایش کلمه */}
        {editingWord && (
          <div className="modal">
            <div className="modal-content">
              <h3>ویرایش کلمه</h3>
              <div className="edit-inputs">
                <input
                  type="text"
                  value={editingWord.english}
                  onChange={(e) =>
                    setEditingWord({ ...editingWord, english: e.target.value })
                  }
                />
                <input
                  type="text"
                  value={editingWord.persian}
                  onChange={(e) =>
                    setEditingWord({ ...editingWord, persian: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button onClick={updateWord}>ذخیره</button>
                <button onClick={() => setEditingWord(null)}>انصراف</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
