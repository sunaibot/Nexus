/**
 * 文件快传插件
 * 在 Header 显示文件快传按钮
 */

import { useState } from 'react'
import { FileUp } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PluginComponentProps } from '../../types'
import FileTransferModal from '../../../components/file-transfer/FileTransferModal'

export default function FileTransferPlugin({ config }: PluginComponentProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer"
        style={{ color: 'var(--text-secondary)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="文件快传"
        title="文件快传"
      >
        <FileUp className="w-4 h-4" />
      </motion.button>

      <FileTransferModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
