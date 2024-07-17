<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import LightSwitch from '$lib/components/ui/light-svelte/light-switch.svelte';
</script>

<header class="flex place-items-center justify-center border-b px-6 py-2">
	<div class="flex w-full max-w-6xl place-items-center justify-between">
		<div></div>
		<div class="flex place-items-center gap-2">
			<LightSwitch />
		</div>
	</div>
</header>
<main style="height: calc(100svh - 57px);" class="flex place-items-center justify-center px-8">
	<div class="flex flex-col place-items-center justify-center gap-4">
		<h1 class="max-w-5xl text-center text-4xl md:text-6xl">
			<span class="rounded-md bg-secondary px-1 py-1 font-serif">
				<span class="text-green-600">@iedan</span>/create
			</span>
			SvelteKit Starter
		</h1>
		<div class="flex place-items-center gap-4">
			<Button href="https://github.com/ieedan/create">See Docs</Button>
		</div>
	</div>
</main>
