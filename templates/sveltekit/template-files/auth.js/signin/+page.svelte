<script lang="ts">
	import { providerMap } from '$lib/auth/providers';
	import { SignIn } from '@auth/sveltekit/components';
	// put icon imports here
</script>

<div class="flex h-svh place-items-center justify-center">
	<div class="flex w-full max-w-[250px] flex-col gap-2 sm:max-w-[300px]">
		<h1 class="text-center text-2xl font-bold">Log in to {{ PROJECT_NAME }}</h1>
		<section class="h-2"></section>
		{#each providerMap as provider}
			<SignIn provider={provider.id} signInPage="signin" className="w-full">
				<div
					slot="submitButton"
					class="flex w-[250px] place-items-center justify-center gap-4 rounded-lg bg-secondary/80 px-6 py-3 text-secondary-foreground hover:bg-secondary sm:w-[300px]"
				>
					Continue with {provider.name}
				</div>
			</SignIn>
		{/each}
	</div>
</div>