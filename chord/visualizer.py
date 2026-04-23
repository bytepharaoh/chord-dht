def print_ring(ring: list, positions: dict = None) -> None:
    if not ring:
        print("Ring is empty.")
        return

    sorted_ring = sorted(ring)
    max_id = 63

    scale = [' [.] '] * (max_id + 1)
    for node in sorted_ring:
        scale[node] = f' [{node:2d}] '

    for i in range(0, max_id + 1, 16):
        if i > 0:
            print('↳', end='')
        chunk = scale[i:i+16]
        print('--'.join(chunk), '🔄' if i == 48 else '')
        print('\n')

    print(f"Nodes: {sorted_ring}")
