import { ScorecardView as ScorecardView_9a5f9f751f8e8777b5d306cbd0ef8841 } from '@/components/Scorecard'
import { ImportLink as ImportLink_54dc4cf0c42de3ddcf999fecb11f62a6 } from '@/components/Import'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { ImportView as ImportView_54dc4cf0c42de3ddcf999fecb11f62a6 } from '@/components/Import'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@/components/Scorecard#ScorecardView": ScorecardView_9a5f9f751f8e8777b5d306cbd0ef8841,
  "@/components/Import#ImportLink": ImportLink_54dc4cf0c42de3ddcf999fecb11f62a6,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@/components/Import#ImportView": ImportView_54dc4cf0c42de3ddcf999fecb11f62a6,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
