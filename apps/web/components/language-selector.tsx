import { languageConfig } from "@/constants/constants"
import { useCurrentUser } from "@/lib/providers/current-user-provider"
import { useEditor } from "@/lib/providers/editor-provider"
import { useRoomId } from "@/lib/providers/roomId-provider"
import { useWebSocket } from "@/lib/providers/web-socket-provider"
import { SupportedLanguage, WSClientRequest } from "@repo/shared/types"
import { ChevronDownIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const LanguageSelector = () => {
  const user = useCurrentUser()
  const {ws} = useWebSocket()
  const {roomId} = useRoomId()
  const {language, setLanguage} = useEditor()
  const [ isDropdownOpen, setIsDropdownOpen ] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if(dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleLanguageChange = (selectedLanguage: SupportedLanguage) => {
    if(!user) {
      toast.error("You must be logged in to change the language.");
      return
    }

    if(!roomId) {
      setLanguage(selectedLanguage)
      toast.success(`Language set to ${selectedLanguage} `)
    }

    else {
      const payload: WSClientRequest = {
        type: "changeLanguage",
        payload: {
          language: selectedLanguage 
        }
      };

      ws?.send(JSON.stringify(payload))
    }
    
    setIsDropdownOpen(false)
  }

  const currentLanguageObj = languageConfig.find((langObj) => langObj.label === language) || languageConfig[0]


  return (
    <div
      ref={dropdownRef} 
      className="relative w-40 border rounded">
      <button 
        onClick={() => setIsDropdownOpen(prev => !prev)}
        className="w-full bg-secondary flex justify-between border items-center px-3 py-2 gap-2  text-sm font-semibold" >
        <div className="flex gap-2 items-center">
          <div className="size-5 flex justify-center items-center">
            <Image
              src={currentLanguageObj.logoPath}
              alt={currentLanguageObj.label}
              width={20}
              height={20}
              className="object-contain w-ful h-full"
            />
          </div>
          <span>{currentLanguageObj.label}</span>
        </div>
        <ChevronDownIcon size={20} ></ChevronDownIcon>
      </button>
      {isDropdownOpen &&
        <div className="absolute top-full right-0 mt-2 w-36  bg-gray-900 border rounded-md  z-10 overflow-hidden" >
          <ul className="flex flex-col p-1" >
            {languageConfig
              .filter((lang) => lang.label !== language)
              .map((lang) => (
                <li key={lang.id} onClick={() => handleLanguageChange(lang.label)}>
                  <button 
                    className="w-full bg-secondary flex justify-start items-center px-3 py-2 gap-2 border rounded-md text-sm font-semibold" >
                    <div className="size-5 flex justify-center items-center">
                      <Image
                        src={lang.logoPath}
                        alt={lang.label}
                        width={20}
                        height={20}
                        className="object-contain w-ful h-full"
                      />
                    </div>
                    <span>{lang.label}</span>
                  </button>
                </li>
              ))
            }
          </ul>
        </div>
      }
    </div>
  )
}

export default LanguageSelector