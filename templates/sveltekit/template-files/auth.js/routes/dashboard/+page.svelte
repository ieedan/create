<script lang="ts">
	import { page } from '$app/stores';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import LightSwitch from '$lib/components/ui/light-svelte/light-switch.svelte';
	import { SignOut } from '@auth/sveltekit/components';
</script>

<header class="flex place-items-center justify-center border-b px-6 py-2">
	<div class="flex w-full max-w-6xl place-items-center justify-between">
		<div></div>
		<div class="flex place-items-center gap-2">
			{#if $page.data.session}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Avatar.Root class="size-7">
							<Avatar.Image
								src={$page.data.session.user?.image}
								alt="{$page.data.session.user?.name}'s user picture"
							/>
							<Avatar.Fallback>
								{$page.data.session.user?.name ? $page.data.session.user?.name[0] : ''}
							</Avatar.Fallback>
						</Avatar.Root>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content sideOffset={5}>
						<DropdownMenu.Group>
							<DropdownMenu.Item>
								{$page.data.session.user.name}
							</DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item href="/" class="hover:cursor-pointer">
								Homepage
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<SignOut>
									<span slot="submitButton">Logout</span>
								</SignOut>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				<Button
					href="/signin?redirectTo=/dashboard"
				>
					Sign In
				</Button>
			{/if}
			<LightSwitch />
		</div>
	</div>
</header>
<main style="height: calc(100svh - 57px);" class="flex place-items-center justify-center px-8">
	<div class="flex flex-col place-items-center justify-center gap-4">
		<h1 class="max-w-5xl text-center font-bold text-4xl md:text-6xl">
			Dashboard [protected]
		</h1>
	</div>
</main>
