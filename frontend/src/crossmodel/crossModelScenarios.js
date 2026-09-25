// Cross-Model Verification scenarios (Page 6, optional lab).
//
// Three image exhibits. Each image is examined by the same three forensic
// models, each using a different method. Findings use the Evidence Graph
// vocabulary only (Consistent / Inconsistent / Cannot determine) — no
// scores, no percentages, no verdicts.
//
// The exhibit images are AI-generated demo props, and every model output
// below is SCRIPTED for the demo (DEMO MODE). In the live product each
// model would run for real.

export const FINDING_LABEL = {
  SUPPORT: 'Consistent',
  CONFLICT: 'Inconsistent',
  UNKNOWN: 'Cannot determine',
};

export const EXHIBITS = {
  'warrant-doc': {
    exhibit: 'Exhibit A',
    title: 'Warrant document',
    img: '/xm/warrant-doc.jpg',
    imgAlt: 'Scanned arrest warrant document with seal and signature',
    source: 'Shared on the Digital Arrest call',
    models: [
      {
        id: 'gen',
        name: 'Generation detector',
        method: 'Diffusion / GAN artifact scan',
        finding: 'CONFLICT',
        result:
          'Diffusion-model texture artifacts across the seal and signature regions — inconsistent with a flatbed scan of ink on paper.',
        uncertainty:
          'Artifact detectors are tuned on known generators. A new generator could evade them; absence of artifacts would not prove authenticity.',
      },
      {
        id: 'manip',
        name: 'Manipulation detector',
        method: 'Splice, copy-move and inpainting trace analysis',
        finding: 'CONFLICT',
        result:
          'The seal shows splice boundaries and lighting inconsistent with the page — composited from another source.',
        uncertainty:
          'Heavy compression can mimic splice traces. This is evidence of compositing, not proof of intent.',
      },
      {
        id: 'prov',
        name: 'Provenance check',
        method: 'Metadata and capture-pipeline inspection',
        finding: 'UNKNOWN',
        result: 'No camera or scanner metadata survives; export tags were stripped before this copy.',
        uncertainty:
          'Stripped metadata is common when images pass through messaging apps — it proves nothing by itself.',
      },
    ],
  },
  'kyc-selfie': {
    exhibit: 'Exhibit B',
    title: 'KYC video selfie',
    img: '/xm/kyc-selfie.jpg',
    imgAlt: 'Video call frame of a person holding up an identity card',
    source: 'Forwarded suspicious message',
    models: [
      {
        id: 'gen',
        name: 'Generation detector',
        method: 'Diffusion / GAN artifact scan',
        finding: 'CONFLICT',
        result:
          'Facial region shows generative upsampling artifacts — inconsistent with a webcam sensor capture.',
        uncertainty:
          'Heavy compression also softens detail. The model weighs multiple traces; no single trace decides.',
      },
      {
        id: 'manip',
        name: 'Manipulation detector',
        method: 'Splice, copy-move and inpainting trace analysis',
        finding: 'SUPPORT',
        result:
          'No splice, copy-move or inpainting traces — consistent with a fully synthetic render, which has nothing to splice.',
        uncertainty:
          'The subtle one: “no manipulation found” does not mean “real”. A fully generated face leaves nothing to splice.',
      },
      {
        id: 'prov',
        name: 'Provenance check',
        method: 'Metadata and capture-pipeline inspection',
        finding: 'UNKNOWN',
        result: 'No EXIF data; the frame arrived through a screen-capture pipeline.',
        uncertainty: 'Screenshots strip provenance by design — the absence says nothing about the face.',
      },
    ],
  },
  'customs-qr': {
    exhibit: 'Exhibit C',
    title: 'Customs payment notice',
    img: '/xm/customs-qr.jpg',
    imgAlt: 'Printed customs fee payment notice with a QR code, photographed on a desk',
    source: 'Photo of a fee notice sent with a payment demand',
    models: [
      {
        id: 'gen',
        name: 'Generation detector',
        method: 'Diffusion / GAN artifact scan',
        finding: 'CONFLICT',
        result:
          'Paper grain and QR edges show diffusion synthesis traces — inconsistent with a photograph of real print.',
        uncertainty:
          'Artifact detectors are tuned on known generators. A new generator could evade them.',
      },
      {
        id: 'manip',
        name: 'Manipulation detector',
        method: 'Splice, copy-move and inpainting trace analysis',
        finding: 'CONFLICT',
        result:
          'The QR block shows paste boundaries against the page background — inserted after the page was rendered.',
        uncertainty:
          'Paste boundaries show the QR was added later. They do not say where the QR leads.',
      },
      {
        id: 'prov',
        name: 'Provenance check',
        method: 'Metadata and capture-pipeline inspection',
        finding: 'SUPPORT',
        result: 'Intact phone-camera EXIF — the photograph itself was taken with a real camera.',
        uncertainty:
          'Provenance authenticates the photograph, not what the photograph shows. A real photo of a fake notice is still a fake notice.',
      },
    ],
  },
};

export const EXHIBIT_IDS = Object.keys(EXHIBITS);
