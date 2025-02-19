"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface PixResponse {
  qrcode_url: string
}

export default function PixQRCode() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [copied, setCopied] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchQRCode = async () => {
      if (!id) {
        setError("Valor não definido")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")
        const response = await fetch(`https://chat-whatsapp.io7xcfjbl8o6yvj.com/qrcode.php?valor=${id}`)
        if (!response.ok) {
          throw new Error("Erro ao gerar QR code")
        }
        const data: PixResponse = await response.json()

        // Extrair os dados do QR code da URL
        const url = new URL(data.qrcode_url)
        const qrData = url.searchParams.get("data")
        if (qrData) {
          setQrCodeData(decodeURIComponent(qrData))
        } else {
          throw new Error("Dados do QR code não encontrados")
        }
      } catch (error) {
        console.error("Erro ao buscar QR code:", error)
        setError("Erro ao gerar QR code. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    fetchQRCode()
  }, [id])

  const handleCopy = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F13] flex flex-col">
      <Card className="flex-1 flex flex-col w-full max-w-md mx-auto bg-gray-800 text-white rounded-none sm:rounded-lg overflow-auto">
        <CardHeader className="flex-shrink-0 flex flex-col items-center pt-6 pb-4">
          <div className="w-28 h-14 mb-6 bg-gray-700 flex items-center justify-center rounded">
            <span className="text-gray-400 text-sm">Logo</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">{error ? "Erro" : "Pague com Pix"}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-start px-6 py-4 space-y-6">
          <div
            className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center"
            style={{ width: "208px", height: "208px" }}
          >
            {loading ? (
              <div className="animate-pulse bg-gray-200 w-52 h-52" />
            ) : error ? (
              <div className="flex items-center justify-center w-52 h-52 bg-gray-100 text-gray-500 text-sm text-center p-4">
                {error}
              </div>
            ) : (
              <QRCodeSVG value={qrCodeData || ""} size={208} level="Q" includeMargin={false} />
            )}
          </div>
          <div className="w-full bg-gray-700 rounded-md p-3 overflow-hidden">
            <p className="text-sm text-gray-300 break-all text-center">
              {error ? "---" : qrCodeData || "Carregando..."}
            </p>
          </div>
          {!error && (
            <p className="text-center text-sm text-gray-300 max-w-xs">
              Escaneie o QR code acima com o app do seu banco ou use o código Pix abaixo.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex-shrink-0 p-6 pt-0">
          <Button
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white text-base"
            onClick={handleCopy}
            disabled={!qrCodeData || !!error}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-5 w-5" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-5 w-5" /> Copiar código Pix
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

