import { GuestData, InviteMember } from '../data/mockData';

/**
 * Returns all members of an invite.
 * If the guest has `members` explicitly populated, returns them.
 * Otherwise, generates the default primary guest and any companions as adults or children.
 */
export function getInviteMembers(guest: GuestData): InviteMember[] {
  if (guest.members && guest.members.length > 0) {
    return guest.members;
  }

  const members: InviteMember[] = [
    {
      id: `${guest.id}-primary`,
      name: guest.name,
      category: 'Adulto',
      status: guest.status === 'confirmed' ? 'confirmed' : guest.status === 'declined' ? 'declined' : null,
      isPrimary: true,
    },
  ];

  if (guest.companionNames && guest.companionNames.length > 0) {
    guest.companionNames.forEach((cName, idx) => {
      const lower = cName.toLowerCase();
      const isChild =
        lower.includes('criança') ||
        lower.includes('enzo') ||
        lower.includes('beatriz') ||
        lower.includes('theo') ||
        lower.includes('sophia');

      members.push({
        id: `${guest.id}-comp-${idx}`,
        name: cName,
        category: isChild ? 'Criança' : 'Adulto',
        status: guest.status === 'confirmed' ? 'confirmed' : guest.status === 'declined' ? 'declined' : null,
        isPrimary: false,
      });
    });
  }

  return members;
}

/**
 * Formats the count of guests in an invite into user-friendly text, e.g.:
 * - "2 adultos e 1 criança"
 * - "1 adulto"
 * - "2 adultos"
 * - "1 criança"
 */
export function getInviteGuestCountText(members: InviteMember[]): string {
  const adults = members.filter((m) => m.category === 'Adulto').length;
  const children = members.filter((m) => m.category === 'Criança').length;

  const parts: string[] = [];
  if (adults > 0) {
    parts.push(`${adults} ${adults === 1 ? 'adulto' : 'adultos'}`);
  }
  if (children > 0) {
    parts.push(`${children} ${children === 1 ? 'criança' : 'crianças'}`);
  }

  return parts.length > 0 ? parts.join(' e ') : '1 convidado';
}

/**
 * Returns response breakdown for members in an invite:
 * { confirmed, declined, pending }
 */
export function getInviteResponseCounts(members: InviteMember[]) {
  let confirmed = 0;
  let declined = 0;
  let pending = 0;

  members.forEach((m) => {
    if (m.status === 'confirmed') confirmed++;
    else if (m.status === 'declined') declined++;
    else pending++;
  });

  return { confirmed, declined, pending };
}
