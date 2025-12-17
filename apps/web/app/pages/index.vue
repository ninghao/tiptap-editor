<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <h1 class="text-3xl font-bold mb-6">Tiptap Editor 演示</h1>
    <p class="text-gray-600 mb-8">
      这是一个功能强大的富文本编辑器演示页面，支持实时协作编辑和本地持久化。
    </p>
    <div class="flex flex-col gap-4">
      <NuxtLink
        to="/local-collaboration-editor"
        class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
      >
        本地协作编辑器（BroadcastChannel）
      </NuxtLink>
      <NuxtLink
        to="/collaboration-editor"
        class="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
      >
        云端协作编辑器（TiptapCollabProvider）
      </NuxtLink>
    </div>
  </div>
</template>
